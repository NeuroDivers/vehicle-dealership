'use client';

import { useState } from 'react';
import { X, DollarSign, Phone, Mail, User, MessageSquare } from 'lucide-react';

interface FinancingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
  };
  language?: 'en' | 'fr' | 'es';
}

const translations = {
  fr: {
    title: 'Demande de financement',
    subtitle: 'Remplissez le formulaire ci-dessous et notre équipe vous contactera sous peu',
    name: 'Nom complet',
    namePlaceholder: 'Jean Dupont',
    email: 'Courriel',
    emailPlaceholder: 'jean@exemple.com',
    phone: 'Téléphone',
    phonePlaceholder: '(514) 555-1234',
    message: 'Message (optionnel)',
    messagePlaceholder: 'Parlez-nous de vos besoins de financement...',
    preferredContact: 'Méthode de contact préférée',
    contactEmail: 'Courriel',
    contactPhone: 'Téléphone',
    contactBoth: 'Les deux',
    submit: 'Soumettre la demande',
    submitting: 'Envoi en cours...',
    cancel: 'Annuler',
    vehicleInfo: 'Véhicule d\'intérêt',
    success: 'Demande envoyée avec succès!',
    successMessage: 'Notre équipe vous contactera bientôt.',
    error: 'Erreur lors de l\'envoi',
    errorMessage: 'Veuillez réessayer plus tard.',
    required: 'Ce champ est requis'
  },
  en: {
    title: 'Financing Request',
    subtitle: 'Fill out the form below and our team will contact you shortly',
    name: 'Full Name',
    namePlaceholder: 'John Smith',
    email: 'Email',
    emailPlaceholder: 'john@example.com',
    phone: 'Phone',
    phonePlaceholder: '(555) 123-4567',
    message: 'Message (optional)',
    messagePlaceholder: 'Tell us about your financing needs...',
    preferredContact: 'Preferred Contact Method',
    contactEmail: 'Email',
    contactPhone: 'Phone',
    contactBoth: 'Both',
    submit: 'Submit Request',
    submitting: 'Submitting...',
    cancel: 'Cancel',
    vehicleInfo: 'Vehicle of Interest',
    success: 'Request sent successfully!',
    successMessage: 'Our team will contact you soon.',
    error: 'Error sending request',
    errorMessage: 'Please try again later.',
    required: 'This field is required'
  },
  es: {
    title: 'Solicitud de financiamiento',
    subtitle: 'Complete el formulario a continuación y nuestro equipo se comunicará con usted pronto',
    name: 'Nombre completo',
    namePlaceholder: 'Juan Pérez',
    email: 'Correo electrónico',
    emailPlaceholder: 'juan@ejemplo.com',
    phone: 'Teléfono',
    phonePlaceholder: '(555) 123-4567',
    message: 'Mensaje (opcional)',
    messagePlaceholder: 'Cuéntenos sobre sus necesidades de financiamiento...',
    preferredContact: 'Método de contacto preferido',
    contactEmail: 'Correo electrónico',
    contactPhone: 'Teléfono',
    contactBoth: 'Ambos',
    submit: 'Enviar solicitud',
    submitting: 'Enviando...',
    cancel: 'Cancelar',
    vehicleInfo: 'Vehículo de interés',
    success: '¡Solicitud enviada con éxito!',
    successMessage: 'Nuestro equipo se comunicará con usted pronto.',
    error: 'Error al enviar la solicitud',
    errorMessage: 'Por favor, inténtelo de nuevo más tarde.',
    required: 'Este campo es obligatorio'
  }
};

export default function FinancingModal({ isOpen, onClose, vehicle, language = 'fr' }: FinancingModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    preferredContact: 'email'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const t = translations[language];

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = t.required;
    if (!formData.email.trim()) newErrors.email = t.required;
    if (!formData.phone.trim()) newErrors.phone = t.required;
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const leadData = {
        vehicle_id: vehicle.id,
        vehicle_make: vehicle.make,
        vehicle_model: vehicle.model,
        vehicle_year: vehicle.year,
        vehicle_price: vehicle.price,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        message: formData.message,
        inquiry_type: 'financing',
        preferred_contact: formData.preferredContact,
        source: 'website',
        timestamp: new Date().toISOString()
      };

      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 
                    'https://vehicle-dealership-api.nick-damato0011527.workers.dev';
      
      const response = await fetch(`${apiUrl}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
      });

      if (response.ok) {
        setSubmitStatus('success');
        setTimeout(() => {
          onClose();
          setFormData({ name: '', email: '', phone: '', message: '', preferredContact: 'email' });
          setSubmitStatus('idle');
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting financing request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-6 w-6 text-white" />
                <h3 className="text-xl font-bold text-white">{t.title}</h3>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="text-blue-100 text-sm mt-2">{t.subtitle}</p>
          </div>

          {/* Vehicle Info */}
          <div className="bg-blue-50 px-6 py-3 border-b">
            <p className="text-sm text-gray-600 mb-1">{t.vehicleInfo}</p>
            <p className="font-semibold text-gray-900">
              {vehicle.year} {vehicle.make} {vehicle.model} - ${vehicle.price.toLocaleString()}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            {submitStatus === 'success' && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold">{t.success}</p>
                <p className="text-green-600 text-sm">{t.successMessage}</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold">{t.error}</p>
                <p className="text-red-600 text-sm">{t.errorMessage}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4 inline mr-1" />
                  {t.name} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t.namePlaceholder}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="h-4 w-4 inline mr-1" />
                  {t.email} *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t.emailPlaceholder}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="h-4 w-4 inline mr-1" />
                  {t.phone} *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t.phonePlaceholder}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Preferred Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.preferredContact}
                </label>
                <div className="flex space-x-4">
                  {['email', 'phone', 'both'].map((method) => (
                    <label key={method} className="flex items-center">
                      <input
                        type="radio"
                        value={method}
                        checked={formData.preferredContact === method}
                        onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {method === 'email' ? t.contactEmail : method === 'phone' ? t.contactPhone : t.contactBoth}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  {t.message}
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t.messagePlaceholder}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t.submitting : t.submit}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
