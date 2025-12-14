'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getVehicleEndpoint } from '@/lib/api-config';
import { constructImageUrl } from '@/lib/image-utils';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Save, Loader2, DollarSign, Percent } from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  odometer: number;
  bodyType: string;
  color: string;
  description?: string;
  isSold: number;
}

export default function EditVehicle() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vehicleId = searchParams.get('id')?.split('?')[0];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Convert AVIF to JPEG using canvas (browser-based conversion)
  const convertAvifToJpeg = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            // Create new file with .jpg extension
            const newFileName = file.name.replace(/\.avif$/i, '.jpg');
            const newFile = new File([blob], newFileName, { type: 'image/jpeg' });
            resolve(newFile);
          } else {
            reject(new Error('Failed to convert image'));
          }
        }, 'image/jpeg', 0.9); // 90% quality
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };
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
    isSold: 0,
    listing_status: 'published',
    stockNumber: '',
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    engineSize: '',
    cylinders: null as number | null,
    vin: '',
    vendor_id: 'internal',
    vendor_name: 'Internal Inventory',
    price_markup_type: 'vendor_default',
    price_markup_value: 0,
    vendor_stock_number: '',
    imagesList: [] as string[],
    originalImages: null as any,
    newImages: [] as any[],
    deletedImages: [] as string[], // Track IDs of deleted images
  });

  useEffect(() => {
    if (!vehicleId) {
      router.push('/admin/vehicles');
      return;
    }

    // Fetch vehicle data
    fetch(getVehicleEndpoint(`/${vehicleId}`))
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert('Vehicle not found');
          router.push('/admin/vehicles');
        } else {
          // Parse images and construct URLs
          let imageUrls: string[] = [];
          if (data.images) {
            const parsedImages = typeof data.images === 'string' ? JSON.parse(data.images) : data.images;
            
            // Handle different image formats
            if (Array.isArray(parsedImages)) {
              imageUrls = parsedImages.map((img: any) => {
                if (typeof img === 'string') {
                  // Check if it's already a full URL or just an ID
                  if (img.startsWith('http')) {
                    return img; // Full URL - use as-is
                  } else {
                    // Just an ID - construct URL
                    return constructImageUrl(img, 'public');
                  }
                } else if (img && img.variants) {
                  // Old format with variants object
                  return img.variants.public || img.variants[0];
                } else if (img && img.id) {
                  // Object with ID - construct URL from ID
                  return constructImageUrl(img.id, 'public');
                }
                return null;
              }).filter((url: any) => url && typeof url === 'string');
            }
          }
          
          setFormData({
            ...data,
            imagesList: imageUrls,
            originalImages: data.images || [],
            newImages: [],
            deletedImages: [],
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch vehicle:', err);
        alert('Failed to load vehicle');
        router.push('/admin/vehicles');
      });
  }, [vehicleId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine original images with new uploads - store only IDs
      let finalImages: string[] = [];
      
      // Parse original images if they exist
      if (formData.originalImages) {
        const original = typeof formData.originalImages === 'string' 
          ? JSON.parse(formData.originalImages) 
          : formData.originalImages;
        // Extract IDs if they're objects, otherwise keep as-is (backward compatibility)
        const originalIds = original.map((img: any) => 
          typeof img === 'object' && img.id ? img.id : img
        );
        finalImages = [...originalIds];
      }
      
      // Add new images - extract only the IDs
      if (formData.newImages && formData.newImages.length > 0) {
        const newImageIds = formData.newImages.map((img: any) => img.id);
        finalImages = [...finalImages, ...newImageIds];
      }
      
      const res = await fetch(getVehicleEndpoint(`/${vehicleId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: finalImages, // Don't double-stringify - the entire body is already being stringified
        }),
      });

      if (res.ok) {
        router.push('/admin/vehicles');
      } else {
        alert('Failed to update vehicle');
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  const decodeVin = async () => {
    if (!vin || vin.length !== 17) {
      setVinError('VIN must be exactly 17 characters');
      return;
    }

    setDecodingVin(true);
    setVinError('');

    try {
      const response = await fetch(
        'https://autopret-api.nick-damato0011527.workers.dev/api/decode-vin',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vin })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to decode VIN');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to decode VIN');
      }

      const data = result.data;

      setFormData(prev => ({
        ...prev,
        make: data.make || prev.make,
        model: data.model || prev.model,
        year: data.year || prev.year,
        bodyType: data.bodyType || prev.bodyType,
        fuelType: data.fuelType || prev.fuelType,
        transmission: data.transmission || prev.transmission,
        drivetrain: data.drivetrain || prev.drivetrain,
        engineSize: data.engineSize || prev.engineSize,
        cylinders: data.engineCylinders || prev.cylinders,
        vin: vin,
      }));

      alert(`✅ VIN decoded: ${data.year} ${data.make} ${data.model}`);
    } catch (error) {
      console.error('VIN decode error:', error);
      setVinError('Failed to decode VIN. Please enter vehicle details manually.');
    } finally {
      setDecodingVin(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'price' || name === 'odometer' || name === 'isSold'
        ? parseInt(value) || 0 
        : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (formData.imagesList.length + files.length > 20) {
      alert(`You can only have up to 20 images. You currently have ${formData.imagesList.length} images.`);
      e.target.value = '';
      return;
    }

    setUploadingImage(true);
    // Note: Cloudflare Images doesn't support AVIF, so we'll convert it
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    
    if (!vehicleId) {
      console.error('No vehicle ID found');
      alert('Error: Vehicle ID not found');
      setUploadingImage(false);
      return;
    }
    
    console.log('Uploading images for vehicle:', vehicleId);
    
    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          console.warn(`File ${file.name} is too large (>5MB), skipping`);
          continue;
        }

        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          console.warn(`File ${file.name} has invalid type, skipping`);
          continue;
        }

        // Convert AVIF to JPEG if needed (Cloudflare Images doesn't support AVIF)
        let fileToUpload = file;
        if (file.type === 'image/avif') {
          console.log(`Converting AVIF file ${file.name} to JPEG...`);
          try {
            fileToUpload = await convertAvifToJpeg(file);
            console.log(`Converted to: ${fileToUpload.name}`);
          } catch (error) {
            console.error(`Failed to convert AVIF file ${file.name}:`, error);
            continue;
          }
        }

        // Create FormData for upload to Cloudflare Images
        const uploadData = new FormData();
        uploadData.append('images', fileToUpload);
        
        // Upload to the vehicle's images endpoint on the Worker
        const uploadUrl = `${getVehicleEndpoint()}/${vehicleId}/images`;
        console.log('Uploading to:', uploadUrl);
        
        const imageUploadRes = await fetch(uploadUrl, {
          method: 'POST',
          body: uploadData,
        });
        
        if (!imageUploadRes.ok) {
          const error = await imageUploadRes.json();
          console.error(`Failed to upload ${file.name}:`, error);
          continue;
        }
        
        const result = await imageUploadRes.json();
        console.log('Upload response:', result);
        
        // Add image info to form data - handle new Cloudflare Images response format
        if (result.images && result.images.length > 0) {
          const newImage = result.images[0];
          
          // Extract URL using utility function (dynamically imported below)
          const { extractImageUrl } = await import('@/lib/image-utils');
          const imageUrl = extractImageUrl(newImage, 'public');
          
          if (imageUrl) {
            setFormData(prev => ({
              ...prev,
              imagesList: [...prev.imagesList, imageUrl],
              newImages: [...(prev.newImages || []), newImage],
            }));
            console.log('Image uploaded successfully:', newImage);
            console.log('Image URL added to list:', imageUrl);
          } else {
            console.error('Could not extract image URL from response:', newImage);
          }
        } else if (result.urls && result.urls.length > 0) {
          // Fallback for old format
          setFormData(prev => ({
            ...prev,
            imagesList: [...prev.imagesList, result.urls[0]],
            newImages: prev.newImages || [], // Ensure newImages is always an array
          }));
          console.log('Image uploaded successfully:', result.urls[0]);
        } else {
          console.warn('Unexpected response format:', result);
          // Try to handle other possible formats
          if (result.url) {
            setFormData(prev => ({
              ...prev,
              imagesList: [...prev.imagesList, result.url],
              newImages: [...(prev.newImages || []), result],
            }));
            console.log('Image uploaded with single URL:', result.url);
          } else if (result.id) {
            // If we just get an ID, use it directly or construct a basic URL
            const imageUrl = result.id;
            setFormData(prev => ({
              ...prev,
              imagesList: [...prev.imagesList, imageUrl],
              newImages: [...(prev.newImages || []), result],
            }));
            console.log('Image uploaded with ID:', result.id);
          }
        }
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload images. Please try again.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = async (index: number) => {
    console.log('removeImage called with index:', index);
    
    // Get the image to be removed
    const imageToRemove = formData.imagesList[index];
    
    // Determine if this is an original or new image
    const originalCount = formData.originalImages 
      ? (typeof formData.originalImages === 'string' 
        ? JSON.parse(formData.originalImages).length 
        : formData.originalImages.length)
      : 0;
    
    let imageIdToDelete: string | null = null;
    
    if (index < originalCount) {
      // This is an original image - extract its ID
      const original = typeof formData.originalImages === 'string' 
        ? JSON.parse(formData.originalImages) 
        : formData.originalImages;
      const originalImage = original[index];
      
      if (originalImage) {
        if (typeof originalImage === 'string') {
          // Try to extract ID from URL if it's a Cloudflare Images URL
          const match = originalImage.match(/\/([^\/]+)\/public$/);
          if (match) {
            imageIdToDelete = match[1];
          }
        } else if (originalImage.id) {
          imageIdToDelete = originalImage.id;
        }
      }
    } else {
      // This is a newly uploaded image
      const newImageIndex = index - originalCount;
      const newImage = formData.newImages?.[newImageIndex];
      if (newImage && newImage.id) {
        imageIdToDelete = newImage.id;
      }
    }
    
    // Delete from Cloudflare if we have an ID and it's not already in deletedImages
    if (imageIdToDelete && !formData.deletedImages?.includes(imageIdToDelete)) {
      try {
        console.log('Deleting image from Cloudflare:', imageIdToDelete);
        const deleteRes = await fetch(`${getVehicleEndpoint()}/${vehicleId}/images/${imageIdToDelete}`, {
          method: 'DELETE',
        });
        
        if (!deleteRes.ok) {
          const error = await deleteRes.text();
          console.error('Failed to delete image from Cloudflare:', error);
        } else {
          console.log('Image deleted from Cloudflare:', imageIdToDelete);
        }
      } catch (error) {
        console.error('Error deleting image from Cloudflare:', error);
      }
    } else {
      console.log('Skipping delete - no ID or already deleted:', imageIdToDelete);
    }
    
    // Update local state
    setFormData(prev => {
      if (index < originalCount) {
        // Removing from original images
        const original = typeof prev.originalImages === 'string' 
          ? JSON.parse(prev.originalImages) 
          : prev.originalImages;
        const updatedOriginal = original.filter((_: any, i: number) => i !== index);
        
        // Add to deleted images list if it has an ID
        const deletedList = imageIdToDelete 
          ? [...(prev.deletedImages || []), imageIdToDelete]
          : prev.deletedImages || [];
        
        return {
          ...prev,
          imagesList: prev.imagesList.filter((_, i) => i !== index),
          originalImages: updatedOriginal,
          deletedImages: deletedList,
        };
      } else {
        // Removing from new images
        const newImageIndex = index - originalCount;
        return {
          ...prev,
          imagesList: prev.imagesList.filter((_, i) => i !== index),
          newImages: prev.newImages ? prev.newImages.filter((_, i) => i !== newImageIndex) : [],
        };
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading vehicle...</p>
        </div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold mb-6">Edit Vehicle</h1>
        
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

            {/* Price Markup Section */}
            <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-semibold text-green-900">Price Markup Settings</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Markup Type
                  </label>
                  <select
                    name="price_markup_type"
                    value={formData.price_markup_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="vendor_default">Use Vendor Default</option>
                    <option value="none">No Markup</option>
                    <option value="amount">Fixed Amount ($)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.price_markup_type === 'vendor_default' 
                      ? 'Uses default markup from vendor settings'
                      : formData.price_markup_type === 'none'
                      ? 'Display original price only'
                      : 'Override vendor default with custom markup'}
                  </p>
                </div>

                {formData.price_markup_type !== 'none' && formData.price_markup_type !== 'vendor_default' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Markup Value
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {formData.price_markup_type === 'amount' ? (
                          <DollarSign className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Percent className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <input
                        type="number"
                        name="price_markup_value"
                        value={formData.price_markup_value}
                        onChange={handleChange}
                        min="0"
                        step={formData.price_markup_type === 'amount' ? '100' : '0.5'}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder={formData.price_markup_type === 'amount' ? '1000' : '10'}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.price_markup_type === 'amount'
                        ? 'Dollar amount to add to base price'
                        : 'Percentage to add to base price'}
                    </p>
                  </div>
                )}
              </div>

              {/* Display Price Preview */}
              {formData.price > 0 && (
                <div className="mt-4 pt-4 border-t border-green-300">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Base Price:</span>
                    <span className="font-medium">${formData.price.toLocaleString()}</span>
                  </div>
                  {formData.price_markup_type !== 'none' && formData.price_markup_type !== 'vendor_default' && formData.price_markup_value > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-600">Markup:</span>
                        <span className="font-medium text-green-600">
                          {formData.price_markup_type === 'amount'
                            ? `+$${formData.price_markup_value.toLocaleString()}`
                            : `+${formData.price_markup_value}%`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-base font-bold mt-2 pt-2 border-t border-green-300">
                        <span className="text-green-900">Display Price:</span>
                        <span className="text-lg text-green-900">
                          ${(
                            formData.price_markup_type === 'amount'
                              ? formData.price + formData.price_markup_value
                              : formData.price + (formData.price * (formData.price_markup_value / 100))
                          ).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  {formData.price_markup_type === 'vendor_default' && (
                    <div className="text-xs text-gray-500 mt-2">
                      💡 Display price will be calculated using {formData.vendor_name || 'vendor'} default markup
                    </div>
                  )}
                </div>
              )}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VIN
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={vin || formData.vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="17-character VIN"
                  maxLength={17}
                />
                <button
                  type="button"
                  onClick={decodeVin}
                  disabled={decodingVin}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
                >
                  {decodingVin ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Decoding...</span>
                    </>
                  ) : (
                    <span>Decode VIN</span>
                  )}
                </button>
              </div>
              {vinError && <p className="text-red-500 text-sm mt-1">{vinError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuel Type
              </label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Gasoline">Gasoline</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transmission
              </label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
                <option value="CVT">CVT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drivetrain
              </label>
              <select
                name="drivetrain"
                value={formData.drivetrain}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FWD">FWD (Front-Wheel Drive)</option>
                <option value="RWD">RWD (Rear-Wheel Drive)</option>
                <option value="AWD">AWD (All-Wheel Drive)</option>
                <option value="4WD">4WD (Four-Wheel Drive)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Engine Size (Optional)
              </label>
              <input
                type="text"
                name="engineSize"
                value={formData.engineSize}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2.4L, 3.6L"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cylinders (Optional)
              </label>
              <input
                type="number"
                name="cylinders"
                value={formData.cylinders || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 4, 6, 8"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listing Status
              </label>
              <select
                name="listing_status"
                value={formData.listing_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft (Work in Progress)</option>
                <option value="published">Published (Available for Sale)</option>
                <option value="unlisted">Unlisted (Temporarily Hidden)</option>
                <option value="sold">Sold</option>
              </select>
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
            {formData.imagesList.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.imagesList.map((image, index) => (
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
                  disabled={uploadingImage || formData.imagesList.length >= 10}
                  multiple
                  className="hidden"
                />
                <div className={`flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors ${
                  uploadingImage || formData.imagesList.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''
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
                        {formData.imagesList.length >= 20 ? 'Maximum 20 images' : 'Upload Images'}
                      </span>
                    </>
                  )}
                </div>
              </label>
              <span className="text-sm text-gray-500">
                {formData.imagesList.length}/20 images uploaded
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
