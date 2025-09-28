'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Eye, 
  TrendingUp, 
  Users, 
  Car,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';

interface VehicleView {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  price: number;
  timestamp: string;
  referrer: string;
  viewCount?: number;
}

interface AnalyticsData {
  totalViews: number;
  uniqueVehiclesViewed: number;
  averageViewsPerVehicle: number;
  topVehicles: VehicleView[];
  recentViews: VehicleView[];
  referrerStats: { source: string; count: number }[];
  dailyViews: { date: string; views: number }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch real analytics data from our API
      const response = await fetch(`/api/analytics/vehicle-views?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      
      // Fallback to mock data if API fails
      const mockData: AnalyticsData = {
        totalViews: 0,
        uniqueVehiclesViewed: 0,
        averageViewsPerVehicle: 0,
        topVehicles: [],
        recentViews: [],
        referrerStats: [
          { source: 'No data yet', count: 0 }
        ],
        dailyViews: []
      };
      setAnalytics(mockData);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold">{analytics?.totalViews.toLocaleString()}</p>
            </div>
            <Eye className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vehicles Viewed</p>
              <p className="text-2xl font-bold">{analytics?.uniqueVehiclesViewed}</p>
            </div>
            <Car className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Views/Vehicle</p>
              <p className="text-2xl font-bold">{analytics?.averageViewsPerVehicle.toFixed(1)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Top Referrer</p>
              <p className="text-2xl font-bold">{analytics?.referrerStats[0]?.source}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Vehicles */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Most Viewed Vehicles
          </h2>
          <div className="space-y-4">
            {analytics?.topVehicles.map((vehicle, index) => (
              <div key={vehicle.vehicleId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                    <p className="text-sm text-gray-600">${vehicle.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{vehicle.viewCount} views</p>
                  <Link
                    href={`/vehicles/detail?id=${vehicle.vehicleId}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Traffic Sources
          </h2>
          <div className="space-y-4">
            {analytics?.referrerStats.map((source, index) => (
              <div key={source.source} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-green-500' :
                    index === 2 ? 'bg-yellow-500' :
                    index === 3 ? 'bg-purple-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="font-medium">{source.source}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{source.count}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    ({((source.count / (analytics?.totalViews || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Recent Vehicle Views
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Vehicle</th>
                <th className="text-left py-3 px-4">Price</th>
                <th className="text-left py-3 px-4">Source</th>
                <th className="text-left py-3 px-4">Time</th>
                <th className="text-left py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.recentViews.map((view, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{view.year} {view.make} {view.model}</p>
                      <p className="text-sm text-gray-600">ID: {view.vehicleId}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">${view.price.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {view.referrer}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatTimeAgo(view.timestamp)}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/vehicles/detail?id=${view.vehicleId}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
