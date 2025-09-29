'use client';

import { useState, useEffect } from 'react';
import { getVehicleEndpoint } from '@/lib/api-config';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Save, Loader2 } from 'lucide-react';

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
          // Parse images and extract URLs
          let imageUrls: string[] = [];
          if (data.images) {
            const parsedImages = typeof data.images === 'string' ? JSON.parse(data.images) : data.images;
            
            // Handle both old format (array of strings) and new Cloudflare Images format
            if (Array.isArray(parsedImages)) {
              imageUrls = parsedImages.map((img: any) => {
                if (typeof img === 'string') {
                  return img; // Old format - direct URL
                } else if (img && img.variants) {
                  // New Cloudflare Images format - use public variant (thumbnail doesn't exist)
                  return img.variants.public || img.variants.gallery;
                } else if (img && img.url) {
                  return img.url; // Other object format
                } else if (img && img.id) {
                  // Cloudflare Images with just ID
                  return img.id;
                }
                return null; // Don't return the object itself
              }).filter((url: any) => url && typeof url === 'string');
            }
          }
          
          setFormData({
            ...data,
            imagesList: imageUrls,
            originalImages: data.images || [], // Keep original format for saving, default to empty array
            newImages: [], // Initialize newImages as empty array
            deletedImages: [], // Initialize deletedImages as empty array
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
      // Combine original images with new uploads
      let finalImages: any[] = [];
      
      // Parse original images if they exist
      if (formData.originalImages) {
        const original = typeof formData.originalImages === 'string' 
          ? JSON.parse(formData.originalImages) 
          : formData.originalImages;
        finalImages = [...original];
      }
      
      // Add new images (with safety check)
      if (formData.newImages && formData.newImages.length > 0) {
        finalImages = [...finalImages, ...formData.newImages];
      }
      
      const res = await fetch(getVehicleEndpoint(`/${vehicleId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: JSON.stringify(finalImages),
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
    if (formData.imagesList.length + files.length > 10) {
      alert(`You can only have up to 10 images. You currently have ${formData.imagesList.length} images.`);
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
          // Use the public variant for display in the form (thumbnail doesn't exist)
          const imageUrl = newImage.variants?.public || newImage.id;
          setFormData(prev => ({
            ...prev,
            imagesList: [...prev.imagesList, imageUrl],
            newImages: [...(prev.newImages || []), newImage], // Store full object for saving with safety check
          }));
          console.log('Image uploaded successfully:', newImage);
          console.log('Image URL added to list:', imageUrl);
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
                Status
              </label>
              <select
                name="isSold"
                value={formData.isSold}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Available</option>
                <option value={1}>Sold</option>
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
                        {formData.imagesList.length >= 10 ? 'Maximum 10 images' : 'Upload Images'}
                      </span>
                    </>
                  )}
                </div>
              </label>
              <span className="text-sm text-gray-500">
                {formData.imagesList.length}/10 images uploaded
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
