'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Download,
  Eye,
  Copy,
  Check,
  X,
  Loader2,
  FolderOpen,
  Grid,
  List,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Settings,
  Link2
} from 'lucide-react';

interface CloudflareImage {
  id: string;
  filename: string;
  uploaded: string;
  variants: string[];
  requireSignedURLs: boolean;
  meta?: {
    vehicleId?: string;
    category?: string;
    description?: string;
  };
  size: number;
  width: number;
  height: number;
}

export default function ImagesPage() {
  const [images, setImages] = useState<CloudflareImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<CloudflareImage | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from Cloudflare Images API
      // For now, using mock data
      setImages(getMockImages());
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockImages = (): CloudflareImage[] => [
    {
      id: 'img_001',
      filename: 'toyota-camry-2023-front.jpg',
      uploaded: '2024-03-20T10:30:00Z',
      variants: ['public', 'thumbnail', 'hero'],
      requireSignedURLs: false,
      meta: { vehicleId: 'vehicle_001', category: 'exterior', description: 'Front view' },
      size: 2048576,
      width: 1920,
      height: 1080
    },
    {
      id: 'img_002',
      filename: 'honda-accord-2023-interior.jpg',
      uploaded: '2024-03-19T14:20:00Z',
      variants: ['public', 'thumbnail'],
      requireSignedURLs: false,
      meta: { vehicleId: 'vehicle_002', category: 'interior', description: 'Dashboard view' },
      size: 1536000,
      width: 1920,
      height: 1080
    },
    {
      id: 'img_003',
      filename: 'ford-f150-2024-side.jpg',
      uploaded: '2024-03-18T09:15:00Z',
      variants: ['public', 'thumbnail', 'hero'],
      requireSignedURLs: false,
      meta: { vehicleId: 'vehicle_003', category: 'exterior', description: 'Side profile' },
      size: 2560000,
      width: 2560,
      height: 1440
    }
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('file', file);
    });

    try {
      // In production, upload to Cloudflare Images
      // const response = await fetch('/api/images/upload', {
      //   method: 'POST',
      //   body: formData
      // });
      
      // Mock successful upload
      setTimeout(() => {
        const newImages: CloudflareImage[] = Array.from(files).map((file, index) => ({
          id: `img_${Date.now()}_${index}`,
          filename: file.name,
          uploaded: new Date().toISOString(),
          variants: ['public', 'thumbnail'],
          requireSignedURLs: false,
          meta: { category: 'uncategorized' },
          size: file.size,
          width: 1920,
          height: 1080
        }));
        
        setImages(prev => [...newImages, ...prev]);
        setUploading(false);
      }, 2000);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
      // In production, delete from Cloudflare Images
      // await fetch(`/api/images/${imageId}`, { method: 'DELETE' });
      
      setImages(prev => prev.filter(img => img.id !== imageId));
      if (selectedImage?.id === imageId) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const copyImageUrl = (imageId: string, variant: string = 'public') => {
    // In production, this would be the actual Cloudflare Images URL
    const url = `https://imagedelivery.net/your-account-hash/${imageId}/${variant}`;
    navigator.clipboard.writeText(url);
    setCopiedId(imageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getImageUrl = (imageId: string, variant: string = 'thumbnail') => {
    // Mock URLs - in production, use actual Cloudflare Images URLs
    return `https://via.placeholder.com/${variant === 'thumbnail' ? '300x200' : '800x600'}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const filteredImages = images.filter(img => {
    const matchesSearch = img.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         img.meta?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || img.meta?.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Image Management</h1>
        <p className="text-gray-600">Powered by Cloudflare Images for optimal performance</p>
      </div>

      {/* Upload Area */}
      <div
        className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Uploading images...</p>
          </div>
        ) : (
          <>
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Drop images here or click to upload</p>
            <p className="text-sm text-gray-600 mb-4">Supports JPG, PNG, WebP, GIF up to 10MB</p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Images
            </label>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="exterior">Exterior</option>
          <option value="interior">Interior</option>
          <option value="engine">Engine</option>
          <option value="features">Features</option>
          <option value="uncategorized">Uncategorized</option>
        </select>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Images Display */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No images found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedImage(image)}
            >
              <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                <img
                  src={getImageUrl(image.id, 'thumbnail')}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="font-medium text-sm truncate">{image.filename}</p>
                <p className="text-xs text-gray-600 mt-1">{formatFileSize(image.size)}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                    {image.meta?.category || 'uncategorized'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyImageUrl(image.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {copiedId === image.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteImage(image.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">Preview</th>
                <th className="text-left py-3 px-4">Filename</th>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-left py-3 px-4">Size</th>
                <th className="text-left py-3 px-4">Dimensions</th>
                <th className="text-left py-3 px-4">Uploaded</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredImages.map((image) => (
                <tr key={image.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <img
                      src={getImageUrl(image.id, 'thumbnail')}
                      alt={image.filename}
                      className="w-16 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium">{image.filename}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                      {image.meta?.category || 'uncategorized'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{formatFileSize(image.size)}</td>
                  <td className="py-3 px-4 text-sm">{image.width} × {image.height}</td>
                  <td className="py-3 px-4 text-sm">
                    {new Date(image.uploaded).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedImage(image)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => copyImageUrl(image.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {copiedId === image.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteImage(image.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold">{selectedImage.filename}</h2>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <img
                  src={getImageUrl(selectedImage.id, 'public')}
                  alt={selectedImage.filename}
                  className="w-full rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Image Details</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Size:</dt>
                      <dd className="font-medium">{formatFileSize(selectedImage.size)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Dimensions:</dt>
                      <dd className="font-medium">{selectedImage.width} × {selectedImage.height}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Category:</dt>
                      <dd className="font-medium">{selectedImage.meta?.category || 'uncategorized'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Uploaded:</dt>
                      <dd className="font-medium">{new Date(selectedImage.uploaded).toLocaleString()}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Available Variants</h3>
                  <div className="space-y-2">
                    {selectedImage.variants.map((variant) => (
                      <div key={variant} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{variant}</span>
                        <button
                          onClick={() => copyImageUrl(selectedImage.id, variant)}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          {copiedId === selectedImage.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                          Copy URL
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    window.open(getImageUrl(selectedImage.id, 'public'), '_blank');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4" />
                  View Full Size
                </button>
                <button
                  onClick={() => {
                    // Download functionality
                    const a = document.createElement('a');
                    a.href = getImageUrl(selectedImage.id, 'public');
                    a.download = selectedImage.filename;
                    a.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={() => {
                    deleteImage(selectedImage.id);
                    setSelectedImage(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
