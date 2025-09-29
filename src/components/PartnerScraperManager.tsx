'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Play, Pause, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface Partner {
  id: number;
  name: string;
  base_url: string;
  is_active: boolean;
  scrape_config: any;
}

interface ScraperRun {
  partner_name: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  metadata?: {
    new_count?: number;
    changed_count?: number;
    removed_count?: number;
    total_count?: number;
    duration?: number;
    error?: string;
  };
}

interface PartnerVehicle {
  id: number;
  partner_name: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: string;
  scraped_at: string;
  url: string;
}

export default function PartnerScraperManager() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [scraperRuns, setScraperRuns] = useState<ScraperRun[]>([]);
  const [partnerVehicles, setPartnerVehicles] = useState<PartnerVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'partners' | 'vehicles' | 'settings'>('overview');
  const [selectedPartner, setSelectedPartner] = useState<number | null>(null);

  // Mock data for development
  useEffect(() => {
    // In production, fetch from your API
    setPartners([
      {
        id: 1,
        name: 'Automobile Lambert',
        base_url: 'https://automobile-lambert.com',
        is_active: true,
        scrape_config: {
          listing_path: '/cars/',
          per_page: 20,
          max_pages: 50
        }
      },
      {
        id: 2,
        name: 'Example Auto Group',
        base_url: 'https://example-auto.com',
        is_active: false,
        scrape_config: {
          listing_path: '/inventory/',
          per_page: 24,
          max_pages: 30
        }
      }
    ]);

    setScraperRuns([
      {
        partner_name: 'Automobile Lambert',
        status: 'completed',
        started_at: new Date(Date.now() - 3600000).toISOString(),
        completed_at: new Date().toISOString(),
        metadata: {
          new_count: 12,
          changed_count: 45,
          removed_count: 3,
          total_count: 523,
          duration: 45000
        }
      },
      {
        partner_name: 'Example Auto Group',
        status: 'running',
        started_at: new Date().toISOString(),
        metadata: {
          total_count: 0
        }
      }
    ]);

    setLoading(false);
  }, []);

  const triggerScrape = async (partnerId: number) => {
    try {
      const response = await fetch('/api/scraper/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId })
      });
      
      if (response.ok) {
        alert('Scraping started successfully');
        // Refresh status
      }
    } catch (error) {
      console.error('Failed to trigger scrape:', error);
      alert('Failed to start scraping');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Partner Inventory Scraper</h2>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        {(['overview', 'partners', 'vehicles', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">2</div>
              <div className="text-sm text-gray-600">Active Partners</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">1,046</div>
              <div className="text-sm text-gray-600">Total Vehicles</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">57</div>
              <div className="text-sm text-gray-600">New Today</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">98%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>

          {/* Recent Scraper Runs */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent Scraper Runs</h3>
            <div className="space-y-3">
              {scraperRuns.map((run, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(run.status)}
                      <div>
                        <div className="font-medium">{run.partner_name}</div>
                        <div className="text-sm text-gray-500">
                          Started {new Date(run.started_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    {run.metadata && run.status === 'completed' && (
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span>{run.metadata.new_count} new</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RefreshCw className="h-4 w-4 text-blue-500" />
                          <span>{run.metadata.changed_count} changed</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          <span>{run.metadata.removed_count} removed</span>
                        </div>
                        {run.metadata.duration && (
                          <div className="text-gray-500">
                            {formatDuration(run.metadata.duration)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {run.status === 'running' && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  )}
                  
                  {run.status === 'failed' && run.metadata?.error && (
                    <div className="mt-3 text-sm text-red-600">
                      Error: {run.metadata.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Partner Configurations</h3>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Add Partner
            </button>
          </div>
          
          <div className="space-y-3">
            {partners.map(partner => (
              <div key={partner.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{partner.name}</div>
                    <div className="text-sm text-gray-500">{partner.base_url}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Pages: {partner.scrape_config.max_pages} | 
                      Per page: {partner.scrape_config.per_page}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      partner.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {partner.is_active ? 'Active' : 'Inactive'}
                    </span>
                    
                    <button
                      onClick={() => triggerScrape(partner.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Run scraper now"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    
                    <button
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                      title="Edit partner"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicles Tab */}
      {activeTab === 'vehicles' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Partner Vehicle Inventory</h3>
          <div className="text-sm text-gray-600 mb-4">
            Showing latest scraped vehicles from all partners
          </div>
          
          {/* This would show a table/grid of scraped vehicles */}
          <div className="border rounded-lg p-8 text-center text-gray-500">
            Vehicle inventory table would go here
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Scraper Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Scrape Delay (ms)
                </label>
                <input
                  type="number"
                  defaultValue={1000}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Concurrent Scrapes
                </label>
                <input
                  type="number"
                  defaultValue={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="robots-check"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="robots-check" className="text-sm text-gray-700">
                  Check robots.txt before scraping
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="image-download"
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="image-download" className="text-sm text-gray-700">
                  Download and cache vehicle images
                </label>
              </div>
              
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Schedule</h3>
            <div className="text-sm text-gray-600">
              <p>Automatic scraping runs:</p>
              <ul className="mt-2 space-y-1">
                <li>• Daily at 2:00 AM UTC</li>
                <li>• Daily at 2:00 PM UTC</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
