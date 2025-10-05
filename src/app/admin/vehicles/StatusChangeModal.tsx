'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  listing_status?: string;
}

interface StatusChangeModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicleId: string, newStatus: string) => Promise<void>;
}

const statusOptions = [
  { 
    value: 'draft', 
    label: 'Draft', 
    description: 'Work in progress - not visible to public',
    color: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  { 
    value: 'published', 
    label: 'Published', 
    description: 'Available for sale - visible to public',
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  { 
    value: 'unlisted', 
    label: 'Unlisted', 
    description: 'Temporarily hidden from public view',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  { 
    value: 'sold', 
    label: 'Sold', 
    description: 'Vehicle has been sold',
    color: 'bg-red-100 text-red-800 border-red-300'
  }
];

export default function StatusChangeModal({ vehicle, isOpen, onClose, onSave }: StatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('published');
  const [saving, setSaving] = useState(false);

  // Update selected status when vehicle changes
  useState(() => {
    if (vehicle) {
      setSelectedStatus(vehicle.listing_status || 'published');
    }
  });

  const handleSave = async () => {
    if (!vehicle) return;
    
    setSaving(true);
    try {
      await onSave(vehicle.id, selectedStatus);
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update vehicle status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !vehicle) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Change Vehicle Status</h3>
              <p className="text-sm text-gray-600 mt-1">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              disabled={saving}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-3">
            {statusOptions.map((status) => (
              <label
                key={status.value}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                  selectedStatus === status.value
                    ? `${status.color} border-current`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={status.value}
                  checked={selectedStatus === status.value}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="mt-1 mr-3 h-4 w-4"
                  disabled={saving}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{status.label}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{status.description}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition font-medium text-gray-700"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
