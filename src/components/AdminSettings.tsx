'use client';

import { useState, useEffect } from 'react';
import { Settings, Key, Brain, Share2, Shield, Eye, EyeOff, Save, RefreshCw, AlertTriangle, Wrench, Trash2 } from 'lucide-react';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'features' | 'credentials' | 'permissions' | 'devtools'>('features');
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheMessage, setCacheMessage] = useState('');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Admin Settings</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('features')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'features'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Brain className="h-4 w-4" />
            Features
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'credentials'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Key className="h-4 w-4" />
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="h-4 w-4" />
            Permissions
          </button>
          <button
            onClick={() => setActiveTab('devtools')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'devtools'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Wrench className="h-4 w-4" />
            Developer Tools
          </button>
        </nav>
      </div>

      {activeTab === 'features' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-medium">AI Features</h2>
            </div>
            <p className="text-gray-600">Configure AI-powered features for your dealership.</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-medium">Social Media Features</h2>
            </div>
            <p className="text-gray-600">Manage automated social media posting.</p>
          </div>
        </div>
      )}

      {activeTab === 'credentials' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-medium">API Credentials</h2>
          </div>
          <p className="text-gray-600 mb-4">Configure API keys for external services.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">OpenAI API Key</label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="sk-..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Twitter API Key</label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Twitter API credentials..."
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-medium">Permission Settings</h2>
          </div>
          <p className="text-gray-600">Manage user access levels and feature permissions.</p>
        </div>
      )}

      {activeTab === 'devtools' && (
        <div className="space-y-6">
          {/* Clear Cache */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trash2 className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-medium">Clear Browser Cache</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Clear browser cache, local storage, and service workers. This can help resolve issues with outdated data or cached resources.
            </p>
            
            {cacheMessage && (
              <div className={`mb-4 p-3 rounded ${
                cacheMessage.includes('success') || cacheMessage.includes('cleared') 
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {cacheMessage}
              </div>
            )}
            
            <button
              onClick={async () => {
                setClearingCache(true);
                setCacheMessage('');
                try {
                  // Call backend API
                  const response = await fetch('https://vehicle-dealership-analytics.nick-damato0011527.workers.dev/api/admin/clear-cache', {
                    method: 'POST',
                  });
                  
                  // Clear client-side caches
                  if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                  }
                  
                  // Clear localStorage
                  localStorage.clear();
                  
                  // Clear sessionStorage
                  sessionStorage.clear();
                  
                  setCacheMessage('✓ Cache cleared successfully! Refresh the page to see changes.');
                  
                  // Auto-refresh after 2 seconds
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                } catch (error) {
                  console.error('Error clearing cache:', error);
                  setCacheMessage('✗ Failed to clear cache. Please try manually clearing your browser cache.');
                } finally {
                  setClearingCache(false);
                }
              }}
              disabled={clearingCache}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clearingCache ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Clearing Cache...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Clear All Cache
                </>
              )}
            </button>
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 text-sm">Warning</p>
                  <p className="text-yellow-800 text-sm mt-1">
                    This will clear all cached data and log you out. You'll need to log in again after the page refreshes.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Debug Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-medium">Debug Information</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">User Agent:</span>
                <span className="font-mono text-xs max-w-md truncate" title={navigator.userAgent}>{navigator.userAgent}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Screen Resolution:</span>
                <span className="font-mono">{window.screen.width} x {window.screen.height}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Viewport Size:</span>
                <span className="font-mono">{window.innerWidth} x {window.innerHeight}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Online Status:</span>
                <span className={navigator.onLine ? 'text-green-600' : 'text-red-600'}>
                  {navigator.onLine ? '✓ Online' : '✗ Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
