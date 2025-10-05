'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import ImageProcessingProgress from './ImageProcessingProgress';

const IMAGE_PROCESSOR_URL = 'https://image-processor.nick-damato0011527.workers.dev';

export default function ImageProcessorPanel() {
  const [stats, setStats] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentJobs();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchRecentJobs();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${IMAGE_PROCESSOR_URL}/api/image-status`);
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
    setLoading(false);
  };
  
  const fetchRecentJobs = async () => {
    try {
      const response = await fetch(`${IMAGE_PROCESSOR_URL}/api/jobs`);
      const data = await response.json();
      if (data.success) {
        setRecentJobs(data.jobs.slice(0, 10)); // Show last 10 jobs
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const processImages = async (batchSize = 10) => {
    setProcessing(true);
    setResult(null);
    
    try {
      const response = await fetch(`${IMAGE_PROCESSOR_URL}/api/process-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize })
      });
      
      const data = await response.json();
      setResult(data);
      
      // Refresh stats after processing
      setTimeout(fetchStats, 1000);
    } catch (error) {
      console.error('Failed to process images:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    setProcessing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-blue-600" />
          Image Processor
        </h2>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Vehicles</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-sm text-yellow-600 mb-1 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Needs Processing
            </div>
            <div className="text-2xl font-bold text-yellow-700">{stats.needingProcessing}</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Fully Processed
            </div>
            <div className="text-2xl font-bold text-green-700">{stats.fullyProcessed}</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">Partial</div>
            <div className="text-2xl font-bold text-blue-700">{stats.partiallyProcessed}</div>
          </div>
        </div>
      )}

      {/* Process Images Button */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => processImages(5)}
            disabled={processing}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                Process 5 Vehicles
              </>
            )}
          </button>
          
          <button
            onClick={() => processImages(10)}
            disabled={processing}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                Process 10 Vehicles
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          💡 This will upload vendor image URLs to Cloudflare Images for faster loading and better performance.
        </p>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`mt-6 p-4 rounded-lg ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                {result.success ? 'Processing Complete' : 'Processing Failed'}
              </h3>
              
              {result.success && (
                <div className="mt-2 space-y-1 text-sm">
                  <div className="text-gray-700">
                    <span className="font-medium">Processed:</span> {result.processed} vehicles
                  </div>
                  <div className="text-green-700">
                    <span className="font-medium">✓ Succeeded:</span> {result.succeeded} vehicles
                  </div>
                  {result.failed > 0 && (
                    <div className="text-yellow-700">
                      <span className="font-medium">⚠ Failed:</span> {result.failed} vehicles (kept vendor URLs)
                    </div>
                  )}
                </div>
              )}
              
              {result.error && (
                <div className="mt-2 text-sm text-red-700">
                  {result.error}
                </div>
              )}
              
              {result.details && result.details.length > 0 && (
                <details className="mt-3">
                  <summary className="text-sm cursor-pointer text-gray-600 hover:text-gray-900">
                    View Details
                  </summary>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {result.details.map((detail: any, index: number) => (
                      <div key={index} className="text-xs bg-white p-2 rounded border">
                        <div className="font-medium">
                          {detail.make} {detail.model} {detail.year}
                        </div>
                        <div className="text-gray-600">
                          {detail.message || detail.error || 'Unknown status'}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Recent Image Processing Jobs</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentJobs.map((job) => (
              <ImageProcessingProgress
                key={job.id}
                jobId={job.id}
                onComplete={fetchRecentJobs}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Parallel processing for speed (5-10x faster)</li>
          <li>✓ Automatic retry with exponential backoff</li>
          <li>✓ Keeps vendor URLs as fallback if upload fails</li>
          <li>✓ Updates database only when successful</li>
          <li>✓ No timeouts - processes independently</li>
          <li>✓ Real-time progress tracking</li>
        </ul>
      </div>
    </div>
  );
}
