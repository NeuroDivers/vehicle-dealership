'use client';

import { useState, useEffect } from 'react';
import { DollarSign, X, Save, Percent } from 'lucide-react';

interface VendorMarkupSettingsProps {
  vendorId: string;
  vendorName: string;
  onClose: () => void;
  onSave: () => void;
}

export default function VendorMarkupSettings({ vendorId, vendorName, onClose, onSave }: VendorMarkupSettingsProps) {
  const [markupType, setMarkupType] = useState<'none' | 'amount' | 'percentage'>('none');
  const [markupValue, setMarkupValue] = useState<string>('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrentSettings();
  }, [vendorId]);

  const loadCurrentSettings = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 
                    'https://vehicle-dealership-analytics.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/vendor-settings`);
      
      if (response.ok) {
        const settings = await response.json();
        const vendorSettings = settings.find((v: any) => v.vendor_id === vendorId);
        
        if (vendorSettings) {
          setMarkupType(vendorSettings.markup_type || 'none');
          setMarkupValue(String(vendorSettings.markup_value || 0));
        }
      }
    } catch (error) {
      console.error('Error loading vendor settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 
                    'https://vehicle-dealership-analytics.nick-damato0011527.workers.dev';
      
      const response = await fetch(`${apiUrl}/api/vendor-settings/${vendorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markup_type: markupType,
          markup_value: parseFloat(markupValue) || 0,
        }),
      });

      if (response.ok) {
        onSave();
        onClose();
      } else {
        alert('Failed to save markup settings');
      }
    } catch (error) {
      console.error('Error saving markup settings:', error);
      alert('Error saving markup settings');
    } finally {
      setSaving(false);
    }
  };

  const calculateExample = () => {
    const basePrice = 25000;
    const value = parseFloat(markupValue) || 0;
    
    if (markupType === 'none') {
      return basePrice;
    } else if (markupType === 'amount') {
      return basePrice + value;
    } else if (markupType === 'percentage') {
      return basePrice + (basePrice * (value / 100));
    }
    return basePrice;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Price Markup Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{vendorName}</h3>
            <p className="text-sm text-gray-600">
              Set a default price markup for all vehicles from this vendor. Individual vehicles can override this setting.
            </p>
          </div>

          {/* Markup Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Markup Type
            </label>
            <select
              value={markupType}
              onChange={(e) => setMarkupType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="none">No Markup</option>
              <option value="amount">Fixed Amount ($)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </div>

          {/* Markup Value */}
          {markupType !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Markup Value
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {markupType === 'amount' ? (
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Percent className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  type="number"
                  value={markupValue}
                  onChange={(e) => setMarkupValue(e.target.value)}
                  min="0"
                  step={markupType === 'amount' ? '100' : '0.5'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={markupType === 'amount' ? '1000' : '10'}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {markupType === 'amount' 
                  ? 'Enter the dollar amount to add to each vehicle price'
                  : 'Enter the percentage to add to each vehicle price'}
              </p>
            </div>
          )}

          {/* Example Calculation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Example Calculation</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Price:</span>
                <span className="font-medium">$25,000</span>
              </div>
              {markupType !== 'none' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Markup:</span>
                    <span className="font-medium text-green-600">
                      {markupType === 'amount' 
                        ? `+$${markupValue}`
                        : `+${markupValue}%`}
                    </span>
                  </div>
                  <div className="border-t border-blue-300 pt-1 mt-1 flex justify-between">
                    <span className="text-gray-900 font-semibold">Display Price:</span>
                    <span className="text-lg font-bold text-blue-900">
                      ${calculateExample().toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              {markupType === 'none' && (
                <div className="flex justify-between">
                  <span className="text-gray-900 font-semibold">Display Price:</span>
                  <span className="text-lg font-bold text-blue-900">$25,000</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              💡 <strong>Note:</strong> You can override this default markup on individual vehicles in the vehicle edit form.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Markup'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
