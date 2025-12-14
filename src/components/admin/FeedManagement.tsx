'use client';

import { useState, useEffect } from 'react';
import { 
  Rss, Plus, Edit2, Trash2, RefreshCw, CheckCircle, 
  XCircle, Clock, AlertCircle, ExternalLink, Save, X
} from 'lucide-react';

interface VendorFeed {
  id: number;
  vendor_id: string;
  vendor_name: string;
  feed_url: string;
  feed_type: 'xml' | 'json' | 'csv';
  is_active: boolean;
  sync_frequency: string;
  last_sync_at?: string;
  last_sync_status?: 'success' | 'error' | 'pending';
  last_sync_message?: string;
  last_sync_count?: number;
  total_syncs: number;
  created_at: string;
  updated_at: string;
}

interface FeedFormData {
  vendor_id: string;
  vendor_name: string;
  feed_url: string;
  feed_type: 'xml' | 'json' | 'csv';
  is_active: boolean;
  sync_frequency: string;
}

export default function FeedManagement() {
  const [feeds, setFeeds] = useState<VendorFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFeed, setEditingFeed] = useState<VendorFeed | null>(null);
  const [formData, setFormData] = useState<FeedFormData>({
    vendor_id: '',
    vendor_name: '',
    feed_url: '',
    feed_type: 'xml',
    is_active: true,
    sync_frequency: 'manual'
  });

  // Use unified autopret-api for feed management
  const FEED_MANAGEMENT_API = process.env.NEXT_PUBLIC_AUTOPRET_API || 
    process.env.NEXT_PUBLIC_ANALYTICS_API_URL ||
    'https://autopret-api.nick-damato0011527.workers.dev';
  const FEED_SCRAPER_API = process.env.NEXT_PUBLIC_FEED_SCRAPER_API || 
    'https://feed-scraper.nick-damato0011527.workers.dev';

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${FEED_MANAGEMENT_API}/api/feeds`);
      const data = await response.json();
      
      if (data.success) {
        setFeeds(data.feeds);
      }
    } catch (error) {
      console.error('Failed to load feeds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (vendorId: string) => {
    try {
      setSyncing(vendorId);
      const response = await fetch(`${FEED_SCRAPER_API}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Successfully synced ${result.saved} new and ${result.updated} updated vehicles from ${result.vendorName}`);
        loadFeeds(); // Reload to get updated sync status
      } else {
        alert(`❌ Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('❌ Sync failed. Check console for details.');
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncing('all');
      const response = await fetch(`${FEED_SCRAPER_API}/api/scrape-all`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Synced ${result.successfulVendors}/${result.totalVendors} vendors. Total vehicles: ${result.totalVehicles}`);
        loadFeeds();
      } else {
        alert(`❌ Sync all failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Sync all error:', error);
      alert('❌ Sync all failed. Check console for details.');
    } finally {
      setSyncing(null);
    }
  };

  const handleAddFeed = async () => {
    try {
      const response = await fetch(`${FEED_MANAGEMENT_API}/api/feeds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ Feed added successfully');
        setShowAddModal(false);
        resetForm();
        loadFeeds();
      } else {
        alert(`❌ Failed to add feed: ${result.error}`);
      }
    } catch (error) {
      console.error('Add feed error:', error);
      alert('❌ Failed to add feed. Check console for details.');
    }
  };

  const handleUpdateFeed = async () => {
    if (!editingFeed) return;
    
    try {
      const response = await fetch(`${FEED_MANAGEMENT_API}/api/feeds/${editingFeed.vendor_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ Feed updated successfully');
        setEditingFeed(null);
        resetForm();
        loadFeeds();
      } else {
        alert(`❌ Failed to update feed: ${result.error}`);
      }
    } catch (error) {
      console.error('Update feed error:', error);
      alert('❌ Failed to update feed. Check console for details.');
    }
  };

  const handleDeleteFeed = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this feed?')) return;
    
    try {
      const response = await fetch(`${FEED_MANAGEMENT_API}/api/feeds/${vendorId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ Feed deleted successfully');
        loadFeeds();
      } else {
        alert(`❌ Failed to delete feed: ${result.error}`);
      }
    } catch (error) {
      console.error('Delete feed error:', error);
      alert('❌ Failed to delete feed. Check console for details.');
    }
  };

  const openEditModal = (feed: VendorFeed) => {
    setEditingFeed(feed);
    setFormData({
      vendor_id: feed.vendor_id,
      vendor_name: feed.vendor_name,
      feed_url: feed.feed_url,
      feed_type: feed.feed_type,
      is_active: feed.is_active,
      sync_frequency: feed.sync_frequency
    });
  };

  const resetForm = () => {
    setFormData({
      vendor_id: '',
      vendor_name: '',
      feed_url: '',
      feed_type: 'xml',
      is_active: true,
      sync_frequency: 'manual'
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2">Loading feeds...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Rss className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Feed Management</h2>
            <p className="text-gray-600">Manage vendor XML/JSON feeds</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSyncAll}
            disabled={syncing !== null}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing === 'all' ? 'animate-spin' : ''}`} />
            Sync All
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Feed
          </button>
        </div>
      </div>

      {/* Feeds Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feed URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Sync</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {feeds.map((feed) => (
              <tr key={feed.id} className={!feed.is_active ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{feed.vendor_name}</div>
                    <div className="text-sm text-gray-500">{feed.vendor_id}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <a 
                    href={feed.feed_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                  >
                    {feed.feed_url.substring(0, 50)}...
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded">
                    {feed.feed_type.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {feed.is_active ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    {feed.last_sync_status === 'success' && (
                      <span className="text-xs text-green-600">✓ {feed.last_sync_count} vehicles</span>
                    )}
                    {feed.last_sync_status === 'error' && (
                      <span className="text-xs text-red-600" title={feed.last_sync_message}>
                        ✗ Error
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-3 h-3" />
                      {formatDate(feed.last_sync_at)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {feed.total_syncs} total syncs
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSync(feed.vendor_id)}
                      disabled={syncing !== null}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                      title="Sync Now"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncing === feed.vendor_id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => openEditModal(feed)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFeed(feed.vendor_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingFeed) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                {editingFeed ? 'Edit Feed' : 'Add New Feed'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingFeed(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vendor ID</label>
                <input
                  type="text"
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                  disabled={!!editingFeed}
                  className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                  placeholder="e.g., myvendor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Vendor Name</label>
                <input
                  type="text"
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., My Vendor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Feed URL</label>
                <input
                  type="url"
                  value={formData.feed_url}
                  onChange={(e) => setFormData({ ...formData, feed_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://example.com/feed.xml"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Feed Type</label>
                  <select
                    value={formData.feed_type}
                    onChange={(e) => setFormData({ ...formData, feed_type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="xml">XML</option>
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Sync Frequency</label>
                  <select
                    value={formData.sync_frequency}
                    onChange={(e) => setFormData({ ...formData, sync_frequency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="manual">Manual</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active (enable syncing)
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={editingFeed ? handleUpdateFeed : handleAddFeed}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                {editingFeed ? 'Update Feed' : 'Add Feed'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingFeed(null);
                  resetForm();
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
