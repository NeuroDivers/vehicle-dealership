'use client';

import { useState, useEffect } from 'react';
import { Settings, Key, Brain, Share2, Shield, Eye, EyeOff, Save, RefreshCw, AlertTriangle } from 'lucide-react';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'features' | 'credentials' | 'permissions'>('features');

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

      <div className="flex justify-end mt-6">
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
