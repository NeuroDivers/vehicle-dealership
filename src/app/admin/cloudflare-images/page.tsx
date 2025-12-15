'use client';

import { useState } from 'react';
import { Trash2, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function CloudflareImagesManagement() {
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isCleaningAll, setIsCleaningAll] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [reprocessStats, setReprocessStats] = useState<any>(null);

  const scanOrphanedImages = async () => {
    setIsScanning(true);
    setStats(null);

    try {
      const response = await fetch('https://autopret123-image-cleanup.nick-damato0011527.workers.dev', {
        method: 'POST',
      });

      const data = await response.json();
      setStats(data.stats);
      setLastRun(new Date().toLocaleString());
      
      if (data.success) {
        if (data.stats.orphaned === 0) {
          alert('✓ No orphaned images found!');
        } else {
          alert(`✓ Found ${data.stats.orphaned} orphaned images`);
        }
      } else {
        alert(`✗ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`✗ Error: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const cleanupOrphanedImages = async () => {
    if (!stats || stats.orphaned === 0) {
      alert('Please scan for orphaned images first');
      return;
    }

    if (!confirm(`Delete ${Math.min(stats.orphaned, 100)} orphaned images?`)) {
      return;
    }

    setIsCleaning(true);

    try {
      const response = await fetch('https://autopret123-image-cleanup.nick-damato0011527.workers.dev', {
        method: 'POST',
      });

      const data = await response.json();
      setStats(data.stats);
      setLastRun(new Date().toLocaleString());
      
      if (data.success) {
        alert(`✓ Deleted ${data.stats.deleted} orphaned images!`);
      } else {
        alert(`✗ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`✗ Error: ${error.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  const cleanupAllOrphanedImages = async () => {
    if (!stats || stats.orphaned === 0) {
      alert('Please scan for orphaned images first');
      return;
    }

    if (!confirm(`Delete ALL ${stats.orphaned} orphaned images? This will run multiple batches.`)) {
      return;
    }

    setIsCleaningAll(true);
    setProgress('');
    let totalDeleted = 0;
    let remainingOrphaned = stats.orphaned;
    let batchNumber = 1;

    try {
      while (remainingOrphaned > 0) {
        setProgress(`Batch ${batchNumber}: Deleting up to 100 images...`);
        
        const response = await fetch('https://autopret123-image-cleanup.nick-damato0011527.workers.dev', {
          method: 'POST',
        });

        const data = await response.json();
        
        if (!data.success) {
          alert(`✗ Error on batch ${batchNumber}: ${data.error}`);
          break;
        }

        totalDeleted += data.stats.deleted;
        remainingOrphaned = data.stats.remaining || 0;
        setStats(data.stats);
        setLastRun(new Date().toLocaleString());
        
        setProgress(`Batch ${batchNumber}: Deleted ${data.stats.deleted} images. Total: ${totalDeleted}. Remaining: ${remainingOrphaned}`);
        
        if (remainingOrphaned === 0) {
          alert(`✓ All done! Deleted ${totalDeleted} orphaned images in ${batchNumber} batches.`);
          break;
        }

        batchNumber++;
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      alert(`✗ Error: ${error.message}`);
    } finally {
      setIsCleaningAll(false);
      setProgress('');
    }
  };

  const reprocessUnprocessedImages = async () => {
    if (!confirm('Scan for vehicles with unprocessed images and trigger image processing?')) {
      return;
    }

    setIsReprocessing(true);
    setReprocessStats(null);
    setProgress('');

    try {
      setProgress('Scanning for vehicles with unprocessed images...');
      
      const response = await fetch('https://image-reprocessor.nick-damato0011527.workers.dev', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        setReprocessStats(data.stats);
        const { needsProcessing, processed, failed } = data.stats;
        
        if (needsProcessing === 0) {
          alert('✓ All vehicle images are already processed!');
        } else {
          alert(`✓ Found ${needsProcessing} vehicles needing processing.\nProcessed: ${processed}\nFailed: ${failed}`);
        }
      } else {
        alert(`✗ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`✗ Error: ${error.message}`);
    } finally {
      setIsReprocessing(false);
      setProgress('');
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Cloudflare Images Management</h1>
        <p className="text-gray-600 mb-6">Manage orphaned images and optimize storage</p>

        {/* Orphaned Images Scanner */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Orphaned Images Cleanup</h2>
            {lastRun && (
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                Last run: {lastRun}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">What are orphaned images?</h3>
                <p className="text-sm text-blue-800">
                  Images that exist in Cloudflare but are no longer referenced by any vehicle in the database. 
                  These typically occur when vehicles are deleted or images are replaced.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={scanOrphanedImages}
              disabled={isScanning || isCleaningAll}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Scan for Orphaned Images'}</span>
            </button>

            {stats && stats.orphaned > 0 && (
              <>
                <button
                  onClick={cleanupOrphanedImages}
                  disabled={isCleaning || isCleaningAll}
                  className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50"
                >
                  <Trash2 className="h-5 w-5" />
                  <span>{isCleaning ? 'Cleaning...' : `Delete ${Math.min(stats.orphaned, 100)} Images`}</span>
                </button>

                {stats.orphaned > 100 && (
                  <button
                    onClick={cleanupAllOrphanedImages}
                    disabled={isCleaning || isCleaningAll}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span>{isCleaningAll ? 'Cleaning All...' : `Delete ALL ${stats.orphaned} Orphaned Images`}</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Progress indicator */}
          {progress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 font-medium">{progress}</p>
            </div>
          )}

          {/* Stats Display */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Database Images</div>
                <div className="text-2xl font-bold text-gray-900">{stats.dbImages?.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Cloudflare Images</div>
                <div className="text-2xl font-bold text-gray-900">{stats.cloudflareImages?.toLocaleString()}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-sm text-yellow-700 mb-1">Orphaned</div>
                <div className="text-2xl font-bold text-yellow-900">{stats.orphaned?.toLocaleString()}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">Deleted</div>
                <div className="text-2xl font-bold text-green-900">{stats.deleted?.toLocaleString()}</div>
              </div>
            </div>
          )}

          {stats && stats.orphaned === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">All Clean!</h3>
                <p className="text-sm text-green-800">No orphaned images found. Your storage is optimized.</p>
              </div>
            </div>
          )}

          {stats && stats.remaining > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>{stats.remaining} orphaned images remaining.</strong> Run cleanup again to delete more (max 100 per run for safety).
              </p>
            </div>
          )}
        </div>

        {/* Image Reprocessing Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Unprocessed Images</h2>
            <Clock className="h-6 w-6 text-gray-400" />
          </div>

          <p className="text-gray-600 mb-4">
            Scan for vehicles with vendor URLs (not yet uploaded to Cloudflare) and trigger image processing.
          </p>

          <button
            onClick={reprocessUnprocessedImages}
            disabled={isReprocessing}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${isReprocessing ? 'animate-spin' : ''}`} />
            <span>{isReprocessing ? 'Processing...' : 'Reprocess Unprocessed Images'}</span>
          </button>

          {reprocessStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Vehicles</div>
                <div className="text-2xl font-bold text-gray-900">{reprocessStats.total?.toLocaleString()}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-sm text-yellow-700 mb-1">Needs Processing</div>
                <div className="text-2xl font-bold text-yellow-900">{reprocessStats.needsProcessing?.toLocaleString()}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">Processed</div>
                <div className="text-2xl font-bold text-green-900">{reprocessStats.processed?.toLocaleString()}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-sm text-red-700 mb-1">Failed</div>
                <div className="text-2xl font-bold text-red-900">{reprocessStats.failed?.toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Automated Jobs</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Orphaned Image Cleanup</h4>
              <p className="text-sm text-gray-600 mb-2">
                Runs <strong>daily at 3 AM UTC</strong> - Scans and deletes orphaned images
              </p>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• Maximum 100 images deleted per run</li>
                <li>• Only deletes images not referenced in database</li>
                <li>• Detailed logging of all operations</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Unprocessed Image Reprocessing</h4>
              <p className="text-sm text-gray-600 mb-2">
                Runs <strong>daily at 4 AM UTC</strong> - Finds vehicles with vendor URLs and triggers image processing
              </p>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• Processes up to 50 vehicles per batch</li>
                <li>• Uploads vendor images to Cloudflare</li>
                <li>• Updates database with Cloudflare image IDs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
