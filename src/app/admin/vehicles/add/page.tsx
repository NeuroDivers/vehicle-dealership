'use client';

import { useState } from 'react';
import { getVehicleEndpoint } from '@/lib/api-config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Search, Loader2 } from 'lucide-react';

export default function AddVehicle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [vin, setVin] = useState('');
  const [decodingVin, setDecodingVin] = useState(false);
  const [vinError, setVinError] = useState('');
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    odometer: 0,
    bodyType: 'Sedan',
    color: '',
    description: '',
    images: [] as string[],
    vin: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(getVehicleEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: JSON.stringify(formData.images), // Convert images array to JSON string for database
        }),
      });

      if (res.ok) {
        router.push('/admin/vehicles');
      } else {
        alert('Failed to add vehicle');
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      alert('Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'price' || name === 'odometer' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  const decodeVin = async () => {
    if (!vin || vin.length !== 17) {
      setVinError('VIN must be exactly 17 characters');
      return;
    }

    setDecodingVin(true);
    setVinError('');

    try {
      // Using NHTSA VIN Decoder API (free, no API key required)
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
      );
      
      if (!response.ok) {
        throw new Error('Failed to decode VIN');
      }

      const data = await response.json();
      const results = data.Results;

      // Extract relevant information from the decoded VIN
      const getValue = (variableId: number) => {
        const item = results.find((r: any) => r.VariableId === variableId);
        return item?.Value || '';
      };

      const getValueByName = (name: string) => {
        const item = results.find((r: any) => r.Variable === name);
        return item?.Value || '';
      };

      // Update form with decoded data
      const make = getValueByName('Make');
      const model = getValueByName('Model');
      const year = parseInt(getValueByName('Model Year')) || new Date().getFullYear();
      const bodyType = getValueByName('Body Class') || 'Sedan';
      const engineInfo = getValueByName('Engine Number of Cylinders');
      const fuelType = getValueByName('Fuel Type - Primary');
      const drivetrain = getValueByName('Drive Type');

      // Build description from available data
      let description = '';
      if (engineInfo) description += `${engineInfo} cylinder engine. `;
      if (fuelType) description += `${fuelType}. `;
      if (drivetrain) description += `${drivetrain}. `;

      setFormData(prev => ({
        ...prev,
        make: make || prev.make,
        model: model || prev.model,
        year: year || prev.year,
        bodyType: mapBodyType(bodyType) || prev.bodyType,
        description: description || prev.description,
        vin: vin,
      }));

      // Success message
      if (make && model) {
        console.log(`VIN decoded successfully: ${year} ${make} ${model}`);
      } else {
        setVinError('VIN decoded but some information may be missing');
      }
    } catch (error) {
      console.error('VIN decode error:', error);
      setVinError('Failed to decode VIN. Please enter vehicle details manually.');
    } finally {
      setDecodingVin(false);
    }
  };

  // Map NHTSA body types to our simplified types
  const mapBodyType = (nhtsa: string): string => {
    const lower = nhtsa.toLowerCase();
    if (lower.includes('sedan')) return 'Sedan';
    if (lower.includes('suv') || lower.includes('utility')) return 'SUV';
    if (lower.includes('truck') || lower.includes('pickup')) return 'Truck';
    if (lower.includes('van')) return 'Van';
    if (lower.includes('coupe')) return 'Coupe';
    if (lower.includes('convertible')) return 'Convertible';
    if (lower.includes('wagon')) return 'Wagon';
    if (lower.includes('hatchback')) return 'Hatchback';
    return 'Sedan'; // Default
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, WebP, or AVIF)');
      e.target.value = '';
      return;
    }

    setUploadingImage(true);
    
    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload directly to Worker API
      const imageUploadRes = await fetch(`${getVehicleEndpoint().replace('/api/vehicles', '')}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!imageUploadRes.ok) {
        const error = await imageUploadRes.json();
        throw new Error(error.error || 'Failed to upload image');
      }
      
      const { url } = await imageUploadRes.json();
      
      // Add image URL to form data
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url],
      }));
      
      // Success feedback
      console.log('Image uploaded successfully:', url);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/vehicles"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vehicles
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Add New Vehicle</h1>
        
        {/* VIN Decoder Section */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold mb-3 text-blue-900">VIN Decoder (Optional)</h2>
          <p className="text-sm text-blue-700 mb-3">
            Enter a 17-character VIN to automatically fill vehicle details
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="Enter VIN (e.g., 1HGBH41JXMN109186)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={17}
            />
            <button
              type="button"
              onClick={decodeVin}
              disabled={decodingVin || vin.length !== 17}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {decodingVin ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Decoding...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Decode VIN
                </>
              )}
            </button>
          </div>
          {vinError && (
            <p className="mt-2 text-sm text-red-600">{vinError}</p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Make *
              </label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Toyota"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Camry"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                min="1900"
                max="2030"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 25000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Odometer (km) *
              </label>
              <input
                type="number"
                name="odometer"
                value={formData.odometer}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Body Type *
              </label>
              <select
                name="bodyType"
                value={formData.bodyType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Truck">Truck</option>
                <option value="Coupe">Coupe</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Minivan">Minivan</option>
                <option value="Convertible">Convertible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color *
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Silver"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter vehicle description..."
            />
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Images
            </label>
            
            {/* Image Preview Grid */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Vehicle ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload Button */}
            <div className="flex items-center space-x-4">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
                  onChange={handleImageUpload}
                  disabled={uploadingImage || formData.images.length >= 10}
                  className="hidden"
                />
                <div className={`flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors ${
                  uploadingImage || formData.images.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                  {uploadingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-gray-600" />
                      <span className="text-gray-600">
                        {formData.images.length >= 10 ? 'Maximum 10 images' : 'Upload Image'}
                      </span>
                    </>
                  )}
                </div>
              </label>
              <span className="text-sm text-gray-500">
                {formData.images.length}/10 images uploaded
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Supported formats: JPEG, PNG, WebP, AVIF (max 5MB each)
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/vehicles"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
