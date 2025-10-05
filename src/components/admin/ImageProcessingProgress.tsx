'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

const IMAGE_PROCESSOR_URL = 'https://image-processor.nick-damato0011527.workers.dev';

interface ImageProcessingProgressProps {
  jobId: string;
  onComplete?: () => void;
}

export default function ImageProcessingProgress({ jobId, onComplete }: ImageProcessingProgressProps) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let pollInterval: NodeJS.Timeout;
    
    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`${IMAGE_PROCESSOR_URL}/api/jobs/${jobId}`);
        const data = await response.json();
        
        if (data.success) {
          setJob(data.job);
          setLoading(false);
          
          // Stop polling if job is completed or failed
          if (data.job.status === 'completed' || data.job.status === 'failed') {
            if (pollInterval) {
              clearInterval(pollInterval);
            }
            if (onComplete) {
              onComplete();
            }
          }
        } else {
          setError(data.error);
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch job status');
        setLoading(false);
      }
    };

    // Initial fetch
    fetchJobStatus();

    // Poll every 2 seconds while job is processing
    pollInterval = setInterval(fetchJobStatus, 2000);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [jobId, onComplete]);

  if (loading && !job) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading progress...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <XCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  if (!job) return null;

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'completed':
        return 'bg-green-100 border-green-200';
      case 'failed':
        return 'bg-red-100 border-red-200';
      case 'processing':
        return 'bg-blue-100 border-blue-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const getProgressColor = () => {
    switch (job.status) {
      case 'completed':
        return 'bg-green-600';
      case 'failed':
        return 'bg-red-600';
      default:
        return 'bg-blue-600';
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${getStatusColor()}`}>
      <div className="flex items-start gap-3">
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">
              Image Processing - {job.vendor_name}
            </div>
            <div className="text-sm font-semibold">
              {job.progress}%
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${job.progress}%` }}
            />
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Vehicles:</span>{' '}
              <span className="font-medium">
                {job.vehicles_processed}/{job.total_vehicles}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Uploaded:</span>{' '}
              <span className="font-medium text-green-700">
                {job.images_uploaded}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Failed:</span>{' '}
              <span className="font-medium text-red-700">
                {job.images_failed}
              </span>
            </div>
            <div className="text-gray-600 truncate" title={job.current_vehicle || 'Waiting...'}>
              {job.status === 'processing' ? (
                <span>
                  <span className="text-gray-500">Processing:</span> {job.current_vehicle}
                </span>
              ) : job.status === 'completed' ? (
                <span className="text-green-600 font-medium">✓ Complete</span>
              ) : (
                <span>Waiting...</span>
              )}
            </div>
          </div>

          {/* Timing Info */}
          {job.started_at && (
            <div className="mt-2 text-xs text-gray-500">
              Started: {new Date(job.started_at).toLocaleTimeString()}
              {job.completed_at && (
                <> • Completed: {new Date(job.completed_at).toLocaleTimeString()}</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for sync history list
export function ImageProcessingBadge({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`${IMAGE_PROCESSOR_URL}/api/jobs/${jobId}`);
        const data = await response.json();
        if (data.success) {
          setJob(data.job);
        }
      } catch (err) {
        console.error('Failed to fetch job:', err);
      }
    };

    fetchJobStatus();
    const interval = setInterval(fetchJobStatus, 3000);
    
    return () => clearInterval(interval);
  }, [jobId]);

  if (!job) return null;

  if (job.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
        <CheckCircle className="w-3 h-3" />
        {job.images_uploaded} images
      </span>
    );
  }

  if (job.status === 'processing') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
        <Loader2 className="w-3 h-3 animate-spin" />
        {job.progress}% ({job.images_uploaded} uploaded)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
      <ImageIcon className="w-3 h-3" />
      Pending
    </span>
  );
}
