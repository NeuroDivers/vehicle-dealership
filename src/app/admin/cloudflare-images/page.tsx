'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function CloudflareImagesManagement() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<any>(null);

  const deleteAllImages = async () => {
    setIsDeleting(true);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-analytics.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/admin/images/delete-all`, {
        method: 'DELETE',
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        alert(`✓ Successfully deleted ${data.deletedCount} images!`);
      } else {
        alert(`✗ Error: ${data.error}`);
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message });
      alert(`✗ Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Dev Tools</h1>
        <p className="text-gray-600 mb-6">Developer-only tools and utilities</p>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b">Cloudflare Images Management</h2>
          <div className="flex items-start space-x-4 mb-6">
            <AlertTriangle className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Danger Zone</h3>
              <p className="text-gray-600 mb-4">
                This action will permanently delete ALL images from Cloudflare Images. 
                This cannot be undone!
              </p>
              <p className="text-sm text-gray-500">
                Use cases for deleting all images:
              </p>
              <ul className="text-sm text-gray-500 list-disc list-inside mt-2 space-y-1">
                <li>Testing image upload functionality</li>
                <li>Clearing duplicate images</li>
                <li>Starting fresh with inventory</li>
                <li>Freeing up Cloudflare Images storage</li>
              </ul>
            </div>
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
            >
              <Trash2 className="h-5 w-5" />
              <span>Delete All Images</span>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-semibold mb-2">
                  ⚠️ Are you absolutely sure?
                </p>
                <p className="text-red-700 text-sm mb-4">
                  This will delete ALL images from Cloudflare Images. Vehicle records 
                  will still have image URLs, but they will be broken until you re-run 
                  the scrapers to re-upload images.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={deleteAllImages}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className={`rounded-lg p-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.success ? '✓ Success' : '✗ Error'}
            </h3>
            <p className={result.success ? 'text-green-700' : 'text-red-700'}>
              {result.message || result.error}
            </p>
            {result.success && (
              <div className="mt-4 text-sm text-green-700">
                <p>• Total found: {result.totalFound}</p>
                <p>• Successfully deleted: {result.deletedCount}</p>
                {result.failedCount > 0 && <p>• Failed: {result.failedCount}</p>}
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">After Deleting All Images</h3>
          <p className="text-blue-800 text-sm mb-2">
            To restore images for your vehicles:
          </p>
          <ol className="text-blue-800 text-sm list-decimal list-inside space-y-1">
            <li>Go to the scraper admin page (SLT Autos or Lambert)</li>
            <li>Click "Run Scraper"</li>
            <li>Scraper will re-upload all images to Cloudflare Images</li>
            <li>Vehicle images will work again</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
