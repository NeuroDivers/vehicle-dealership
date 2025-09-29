'use client';

import { useState, useEffect } from 'react';
import AICostMonitor from './AICostMonitor';

interface AISettings {
  features: {
    chat: {
      enabled: boolean;
      model: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
      maxRequestsPerHour: number;
      requireCaptcha: boolean;
      allowedDomains: string[];
    };
    descriptions: {
      enabled: boolean;
      model: 'gpt-3.5-turbo' | 'gpt-4';
      autoGenerate: boolean;
      cacheResults: boolean;
    };
    translations: {
      enabled: boolean;
      model: 'gpt-3.5-turbo';
      languages: string[];
      cacheResults: boolean;
    };
    leadAnalysis: {
      enabled: boolean;
      model: 'gpt-4';
      autoScore: boolean;
      generateFollowUps: boolean;
    };
  };
  security: {
    rateLimiting: {
      enabled: boolean;
      maxRequestsPerIP: number;
      windowMinutes: number;
      blockDuration: number;
    };
    captcha: {
      enabled: boolean;
      provider: 'recaptcha' | 'hcaptcha' | 'cloudflare';
      siteKey: string;
      secretKey: string;
      threshold: number;
    };
    botDetection: {
      enabled: boolean;
      checkUserAgent: boolean;
      checkBehavior: boolean;
      minimumInteractionTime: number;
      requireMouseMovement: boolean;
    };
    ipFiltering: {
      enabled: boolean;
      whitelist: string[];
      blacklist: string[];
      blockVPN: boolean;
      blockTor: boolean;
    };
  };
  costs: {
    monthlyBudget: number;
    alertThreshold: number;
    autoDisableOnLimit: boolean;
    currentUsage: number;
  };
}

const defaultSettings: AISettings = {
  features: {
    chat: {
      enabled: false,
      model: 'gpt-3.5-turbo',
      maxRequestsPerHour: 10,
      requireCaptcha: true,
      allowedDomains: []
    },
    descriptions: {
      enabled: false,
      model: 'gpt-3.5-turbo',
      autoGenerate: false,
      cacheResults: true
    },
    translations: {
      enabled: false,
      model: 'gpt-3.5-turbo',
      languages: ['fr', 'es', 'en'],
      cacheResults: true
    },
    leadAnalysis: {
      enabled: false,
      model: 'gpt-4',
      autoScore: true,
      generateFollowUps: false
    }
  },
  security: {
    rateLimiting: {
      enabled: true,
      maxRequestsPerIP: 20,
      windowMinutes: 60,
      blockDuration: 1440 // 24 hours in minutes
    },
    captcha: {
      enabled: false,
      provider: 'recaptcha',
      siteKey: '',
      secretKey: '',
      threshold: 0.5
    },
    botDetection: {
      enabled: true,
      checkUserAgent: true,
      checkBehavior: true,
      minimumInteractionTime: 2000, // 2 seconds
      requireMouseMovement: true
    },
    ipFiltering: {
      enabled: false,
      whitelist: [],
      blacklist: [],
      blockVPN: false,
      blockTor: true
    }
  },
  costs: {
    monthlyBudget: 50,
    alertThreshold: 40,
    autoDisableOnLimit: true,
    currentUsage: 0
  }
};

export default function AIFeatureManager() {
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'features' | 'security' | 'costs'>('features');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from API
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Try to load from localStorage first
      const localSettings = localStorage.getItem('aiSettings');
      if (localSettings) {
        setSettings(JSON.parse(localSettings));
      }
      
      // Then try to load from API
      const response = await fetch('/api/admin/ai-settings');
      if (response.ok) {
        const data = await response.json();
        const apiSettings = data.settings || defaultSettings;
        setSettings(apiSettings);
        // Save to localStorage as backup
        localStorage.setItem('aiSettings', JSON.stringify(apiSettings));
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      // Use localStorage or defaults if API fails
      const localSettings = localStorage.getItem('aiSettings');
      if (localSettings) {
        setSettings(JSON.parse(localSettings));
      }
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Always save to localStorage
      localStorage.setItem('aiSettings', JSON.stringify(settings));
      
      // Try to save to API
      const response = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        // Still show success if localStorage save worked
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save AI settings to API:', error);
      // Show success anyway since localStorage worked
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateFeature = (feature: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: {
          ...prev.features[feature as keyof typeof prev.features],
          [key]: value
        }
      }
    }));
  };

  const updateSecurity = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [section]: {
          ...prev.security[section as keyof typeof prev.security],
          [key]: value
        }
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Feature Management</h2>
        <button
          onClick={saveSettings}
          disabled={loading}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } disabled:opacity-50`}
        >
          {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {(['features', 'security', 'costs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'costs' ? 'Costs & Monitoring' : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          {/* Chat Feature */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">AI Chat Assistant</h3>
                <p className="text-sm text-gray-600">
                  Conversational AI for customer inquiries and vehicle recommendations
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.features.chat.enabled}
                  onChange={(e) => updateFeature('chat', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.features.chat.enabled && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium mb-2">AI Model</label>
                  <select
                    value={settings.features.chat.model}
                    onChange={(e) => updateFeature('chat', 'model', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Economical)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo (Balanced)</option>
                    <option value="gpt-4">GPT-4 (Premium)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Max Requests per Hour per User
                  </label>
                  <input
                    type="number"
                    value={settings.features.chat.maxRequestsPerHour}
                    onChange={(e) => updateFeature('chat', 'maxRequestsPerHour', parseInt(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chat-captcha"
                    checked={settings.features.chat.requireCaptcha}
                    onChange={(e) => updateFeature('chat', 'requireCaptcha', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="chat-captcha" className="text-sm">
                    Require CAPTCHA verification for chat
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Descriptions Feature */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">AI Vehicle Descriptions</h3>
                <p className="text-sm text-gray-600">
                  Generate compelling vehicle descriptions automatically
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.features.descriptions.enabled}
                  onChange={(e) => updateFeature('descriptions', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.features.descriptions.enabled && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-generate"
                    checked={settings.features.descriptions.autoGenerate}
                    onChange={(e) => updateFeature('descriptions', 'autoGenerate', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="auto-generate" className="text-sm">
                    Auto-generate descriptions for new vehicles
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="cache-descriptions"
                    checked={settings.features.descriptions.cacheResults}
                    onChange={(e) => updateFeature('descriptions', 'cacheResults', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="cache-descriptions" className="text-sm">
                    Cache generated descriptions
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Translations Feature */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">AI Translations</h3>
                <p className="text-sm text-gray-600">
                  Translate content to multiple languages
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.features.translations.enabled}
                  onChange={(e) => updateFeature('translations', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Lead Analysis Feature */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">AI Lead Analysis</h3>
                <p className="text-sm text-gray-600">
                  Score and analyze leads automatically
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.features.leadAnalysis.enabled}
                  onChange={(e) => updateFeature('leadAnalysis', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Rate Limiting */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Rate Limiting</h3>
                <p className="text-sm text-gray-600">
                  Prevent abuse by limiting requests per IP address
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.rateLimiting.enabled}
                  onChange={(e) => updateSecurity('rateLimiting', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.security.rateLimiting.enabled && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Requests per IP
                    </label>
                    <input
                      type="number"
                      value={settings.security.rateLimiting.maxRequestsPerIP}
                      onChange={(e) => updateSecurity('rateLimiting', 'maxRequestsPerIP', parseInt(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Time Window (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.security.rateLimiting.windowMinutes}
                      onChange={(e) => updateSecurity('rateLimiting', 'windowMinutes', parseInt(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bot Detection */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Bot Detection</h3>
                <p className="text-sm text-gray-600">
                  Detect and block automated bot traffic
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.botDetection.enabled}
                  onChange={(e) => updateSecurity('botDetection', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.security.botDetection.enabled && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="check-user-agent"
                    checked={settings.security.botDetection.checkUserAgent}
                    onChange={(e) => updateSecurity('botDetection', 'checkUserAgent', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="check-user-agent" className="text-sm">
                    Check User-Agent for known bots
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="check-behavior"
                    checked={settings.security.botDetection.checkBehavior}
                    onChange={(e) => updateSecurity('botDetection', 'checkBehavior', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="check-behavior" className="text-sm">
                    Analyze user behavior patterns
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="require-mouse"
                    checked={settings.security.botDetection.requireMouseMovement}
                    onChange={(e) => updateSecurity('botDetection', 'requireMouseMovement', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="require-mouse" className="text-sm">
                    Require mouse movement before chat
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Minimum Interaction Time (ms)
                  </label>
                  <input
                    type="number"
                    value={settings.security.botDetection.minimumInteractionTime}
                    onChange={(e) => updateSecurity('botDetection', 'minimumInteractionTime', parseInt(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="2000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Time user must spend on page before chat is enabled
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CAPTCHA */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">CAPTCHA Verification</h3>
                <p className="text-sm text-gray-600">
                  Require human verification for AI features
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.captcha.enabled}
                  onChange={(e) => updateSecurity('captcha', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.security.captcha.enabled && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium mb-2">Provider</label>
                  <select
                    value={settings.security.captcha.provider}
                    onChange={(e) => updateSecurity('captcha', 'provider', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="recaptcha">Google reCAPTCHA v3</option>
                    <option value="hcaptcha">hCaptcha</option>
                    <option value="cloudflare">Cloudflare Turnstile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Site Key</label>
                  <input
                    type="text"
                    value={settings.security.captcha.siteKey}
                    onChange={(e) => updateSecurity('captcha', 'siteKey', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Your CAPTCHA site key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Secret Key</label>
                  <input
                    type="password"
                    value={settings.security.captcha.secretKey}
                    onChange={(e) => updateSecurity('captcha', 'secretKey', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Your CAPTCHA secret key"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Costs Tab */}
      {activeTab === 'costs' && (
        <div className="space-y-6">
          {/* Budget Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Budget Management</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Monthly Budget ($)
                </label>
                <input
                  type="number"
                  value={settings.costs.monthlyBudget}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    costs: { ...prev.costs, monthlyBudget: parseFloat(e.target.value) }
                  }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Alert Threshold ($)
                </label>
                <input
                  type="number"
                  value={settings.costs.alertThreshold}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    costs: { ...prev.costs, alertThreshold: parseFloat(e.target.value) }
                  }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Send alert when usage reaches this amount
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-disable"
                  checked={settings.costs.autoDisableOnLimit}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    costs: { ...prev.costs, autoDisableOnLimit: e.target.checked }
                  }))}
                  className="rounded"
                />
                <label htmlFor="auto-disable" className="text-sm">
                  Automatically disable AI features when budget is reached
                </label>
              </div>
            </div>
          </div>

          {/* Cost Monitor */}
          <AICostMonitor />
        </div>
      )}
    </div>
  );
}
