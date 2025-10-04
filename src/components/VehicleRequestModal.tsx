'use client';

import { useState } from 'react';
import { X, Search, CheckCircle } from 'lucide-react';

interface VehicleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery?: string;
  language?: 'en' | 'fr' | 'es';
}

const translations = {
  en: {
    title: "We Can Find Your Dream Vehicle!",
    subtitle: "No results found in our current inventory, but don't worry!",
    message: "Through our vast network of partnerships and direct access to auctions, we can locate the exact vehicle you're looking for.",
    benefits: [
      "Access to thousands of vehicles through our dealer network",
      "Direct auction access for competitive pricing",
      "We handle all the paperwork and delivery",
      "No obligation - free vehicle search service"
    ],
    formTitle: "Tell us what you're looking for:",
    name: "Full Name",
    namePlaceholder: "John Doe",
    email: "Email",
    emailPlaceholder: "john@example.com",
    phone: "Phone",
    phonePlaceholder: "(514) 555-1234",
    vehicle: "Vehicle Details",
    vehiclePlaceholder: "e.g., 2020 Honda Civic, Silver, under 50k km",
    budget: "Budget (Optional)",
    budgetPlaceholder: "e.g., $15,000 - $20,000",
    message: "Additional Details",
    messagePlaceholder: "Any specific features or requirements...",
    submit: "Submit Request",
    submitting: "Sending...",
    cancel: "Cancel",
    success: "Request Sent Successfully!",
    successMessage: "We'll contact you within 24 hours with available options.",
    searchedFor: "You searched for:"
  },
  fr: {
    title: "Nous Pouvons Trouver Votre Véhicule de Rêve!",
    subtitle: "Aucun résultat dans notre inventaire actuel, mais ne vous inquiétez pas!",
    message: "Grâce à notre vaste réseau de partenaires et notre accès direct aux enchères, nous pouvons localiser le véhicule exact que vous recherchez.",
    benefits: [
      "Accès à des milliers de véhicules via notre réseau de concessionnaires",
      "Accès direct aux enchères pour des prix compétitifs",
      "Nous gérons toute la paperasse et la livraison",
      "Sans obligation - service de recherche de véhicules gratuit"
    ],
    formTitle: "Dites-nous ce que vous cherchez:",
    name: "Nom Complet",
    namePlaceholder: "Jean Dupont",
    email: "Courriel",
    emailPlaceholder: "jean@exemple.com",
    phone: "Téléphone",
    phonePlaceholder: "(514) 555-1234",
    vehicle: "Détails du Véhicule",
    vehiclePlaceholder: "ex: Honda Civic 2020, Argent, moins de 50k km",
    budget: "Budget (Optionnel)",
    budgetPlaceholder: "ex: 15 000$ - 20 000$",
    message: "Détails Supplémentaires",
    messagePlaceholder: "Caractéristiques ou exigences spécifiques...",
    submit: "Soumettre la Demande",
    submitting: "Envoi en cours...",
    cancel: "Annuler",
    success: "Demande Envoyée avec Succès!",
    successMessage: "Nous vous contacterons dans les 24 heures avec les options disponibles.",
    searchedFor: "Vous avez recherché:"
  },
  es: {
    title: "¡Podemos Encontrar Su Vehículo Soñado!",
    subtitle: "No se encontraron resultados en nuestro inventario actual, ¡pero no se preocupe!",
    message: "A través de nuestra amplia red de asociaciones y acceso directo a subastas, podemos localizar el vehículo exacto que está buscando.",
    benefits: [
      "Acceso a miles de vehículos a través de nuestra red de concesionarios",
      "Acceso directo a subastas para precios competitivos",
      "Manejamos todo el papeleo y la entrega",
      "Sin obligación - servicio gratuito de búsqueda de vehículos"
    ],
    formTitle: "Díganos qué está buscando:",
    name: "Nombre Completo",
    namePlaceholder: "Juan Pérez",
    email: "Correo Electrónico",
    emailPlaceholder: "juan@ejemplo.com",
    phone: "Teléfono",
    phonePlaceholder: "(514) 555-1234",
    vehicle: "Detalles del Vehículo",
    vehiclePlaceholder: "ej: Honda Civic 2020, Plateado, menos de 50k km",
    budget: "Presupuesto (Opcional)",
    budgetPlaceholder: "ej: $15,000 - $20,000",
    message: "Detalles Adicionales",
    messagePlaceholder: "Características o requisitos específicos...",
    submit: "Enviar Solicitud",
    submitting: "Enviando...",
    cancel: "Cancelar",
    success: "¡Solicitud Enviada Exitosamente!",
    successMessage: "Nos pondremos en contacto con usted dentro de 24 horas con las opciones disponibles.",
    searchedFor: "Buscó:"
  }
};

export default function VehicleRequestModal({ isOpen, onClose, searchQuery, language = 'en' }: VehicleRequestModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleDetails: searchQuery || '',
    budget: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const leadData = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        vehicle_details: formData.vehicleDetails,
        budget: formData.budget,
        message: formData.message,
        inquiry_type: 'vehicle_request',
        search_query: searchQuery,
        preferred_contact: 'both',
        source: 'website_no_results',
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
        
        // Send email notification
        try {
          await fetch('https://email-notification-worker.nick-damato0011527.workers.dev/notify/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              subject: `Vehicle Request: ${formData.vehicleDetails}`
            })
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }

        setTimeout(() => {
          onClose();
          setFormData({ name: '', email: '', phone: '', vehicleDetails: searchQuery || '', budget: '', message: '' });
          setSubmitStatus('idle');
        }, 3000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-3 mb-2">
            <Search className="h-8 w-8" />
            <h2 className="text-2xl font-bold">{t.title}</h2>
          </div>
          <p className="text-green-100">{t.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitStatus === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{t.success}</h3>
              <p className="text-gray-600">{t.successMessage}</p>
            </div>
          ) : (
            <>
              {/* Search Query Display */}
              {searchQuery && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 font-semibold mb-1">{t.searchedFor}</p>
                  <p className="text-blue-900 font-medium">"{searchQuery}"</p>
                </div>
              )}

              {/* Message */}
              <p className="text-gray-700 mb-4">{t.message}</p>

              {/* Benefits */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <ul className="space-y-2">
                  {t.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.formTitle}</h3>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.name} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t.namePlaceholder}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.email} *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t.emailPlaceholder}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.phone} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t.phonePlaceholder}
                  />
                </div>

                {/* Vehicle Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.vehicle} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleDetails}
                    onChange={(e) => setFormData({ ...formData, vehicleDetails: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t.vehiclePlaceholder}
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.budget}
                  </label>
                  <input
                    type="text"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t.budgetPlaceholder}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.message}
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t.messagePlaceholder}
                  />
                </div>

                {/* Error Message */}
                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    Failed to submit request. Please try again.
                  </div>
                )}

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isSubmitting ? t.submitting : t.submit}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    {t.cancel}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
