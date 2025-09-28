'use client';

import { useState } from 'react';
import { X, Phone, Mail, MessageCircle, Star } from 'lucide-react';
import { submitLead } from '@/lib/analytics-config';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
}

interface VehicleContactFormProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

export default function VehicleContactForm({ vehicle, isOpen, onClose }: VehicleContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    inquiryType: 'general',
    preferredContact: 'email'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Calculate lead score based on form data
      let leadScore = 50; // Base score
      
      // Scoring factors
      if (formData.phone) leadScore += 20; // Phone number provided
      if (formData.message.length > 50) leadScore += 15; // Detailed message
      if (formData.inquiryType === 'purchase') leadScore += 25; // Purchase intent
      if (formData.inquiryType === 'financing') leadScore += 20; // Financing inquiry
      if (formData.preferredContact === 'phone') leadScore += 10; // Prefers phone contact
      
      // Cap at 100
      leadScore = Math.min(leadScore, 100);

      const leadData = {
        vehicleId: vehicle.id,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model,
        vehicleYear: vehicle.year,
        vehiclePrice: vehicle.price,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        message: formData.message,
        inquiryType: formData.inquiryType,
        preferredContact: formData.preferredContact,
        leadScore,
        status: 'new',
        source: 'website',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Submit to leads API using analytics config
      const result = await submitLead(leadData);

      if (result.success) {
        setSubmitted(true);
        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
          setFormData({
            name: '',
            email: '',
            phone: '',
            message: '',
            inquiryType: 'general',
            preferredContact: 'email'
          });
          onClose();
        }, 3000);
      } else {
        throw new Error('Failed to submit inquiry');
      }
    } catch (error) {
      console.error('Lead submission error:', error);
      alert('Sorry, there was an error submitting your inquiry. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
          <p className="text-gray-600 mb-4">
            Your inquiry about the {vehicle.year} {vehicle.make} {vehicle.model} has been received. 
            We'll contact you within 24 hours.
          </p>
          <p className="text-sm text-gray-500">
            This window will close automatically...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Interested in this vehicle?</h2>
              <p className="text-gray-600">
                {vehicle.year} {vehicle.make} {vehicle.model} - ${vehicle.price.toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>

            {/* Inquiry Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type of Inquiry
              </label>
              <select
                value={formData.inquiryType}
                onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General Information</option>
                <option value="purchase">Ready to Purchase</option>
                <option value="financing">Financing Options</option>
                <option value="trade">Trade-In Inquiry</option>
                <option value="inspection">Schedule Inspection</option>
              </select>
            </div>

            {/* Preferred Contact Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Method
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="email"
                    checked={formData.preferredContact === 'email'}
                    onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                    className="mr-2"
                  />
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="phone"
                    checked={formData.preferredContact === 'phone'}
                    onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                    className="mr-2"
                  />
                  <Phone className="h-4 w-4 mr-1" />
                  Phone
                </label>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us more about your interest in this vehicle, any questions you have, or specific requirements..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    <span>Send Inquiry</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
