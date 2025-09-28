'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  isSold: number;
}

export default function VehicleContactButton({ vehicle }: { vehicle: Vehicle }) {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowContactModal(true)}
        disabled={vehicle.isSold === 1}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
          vehicle.isSold === 1
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {vehicle.isSold === 1 ? 'Vehicle Sold' : 'Contact Us About This Vehicle'}
      </button>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-600" />
                <span>(555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <span>info@autodealership.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>123 Main St, City, State 12345</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Reference: {vehicle.year} {vehicle.make} {vehicle.model} (ID: {vehicle.id})
            </p>
            <button
              onClick={() => setShowContactModal(false)}
              className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
