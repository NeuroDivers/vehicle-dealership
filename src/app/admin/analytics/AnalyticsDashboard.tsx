'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Car,
  Search,
  DollarSign,
  Eye,
  Target,
  BarChart3,
  Activity,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface DashboardData {
  overview: {
    vehicleViews: {
      totalViews: number;
      uniqueVehicles: number;
      uniqueVisitors: number;
    };
    searchStats: {
      totalSearches: number;
      uniqueQueries: number;
      avgResults: number;
    };
    leadStats: {
      totalLeads: number;
      newLeads: number;
      contactedLeads: number;
      qualifiedLeads: number;
      closedLeads: number;
      avgLeadScore: number;
    };
  };
  topVehicles: Array<{
    vehicle_id: string;
    make: string;
    model: string;
    year: number;
    viewCount: number;
  }>;
  popularSearches: Array<{
    query: string;
    count: number;
    avgResults: number;
  }>;
  staffPerformance: Array<{
    assigned_to: string;
    totalLeads: number;
    closedLeads: number;
    avgScore: number;
  }>;
  dailyTrends: Array<{
    date: string;
    views: number;
  }>;
  referrerStats: Array<{
    source: string;
    count: number;
  }>;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [previousData, setPreviousData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-analytics.nick-damato0011527.workers.dev'}/api/analytics/dashboard?timeRange=${timeRange}`
      );
      
      if (response.ok) {
        const newData = await response.json();
        setPreviousData(data);
        setData(newData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return { value: 0, trend: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  const StatCard = ({ title, value, icon: Icon, change, color = 'blue' }: any) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`${colorClasses[color]} p-3 rounded-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {change && (
            <div className={`flex items-center text-sm ${
              change.trend === 'up' ? 'text-green-600' : 
              change.trend === 'down' ? 'text-red-600' : 
              'text-gray-500'
            }`}>
              {change.trend === 'up' ? <ArrowUp className="h-4 w-4" /> :
               change.trend === 'down' ? <ArrowDown className="h-4 w-4" /> :
               <Minus className="h-4 w-4" />}
              <span className="ml-1">{change.value.toFixed(1)}%</span>
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</h3>
        <p className="text-sm text-gray-600 mt-1">{title}</p>
      </div>
    );
  };

  const MiniChart = ({ data, title, color = 'blue' }: any) => {
    if (!data || data.length === 0) return null;
    
    const max = Math.max(...data.map((d: any) => d.views || d.count || 0));
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500'
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-end justify-between h-32 gap-1">
          {data.slice(-7).map((item: any, index: number) => {
            const height = max > 0 ? ((item.views || item.count || 0) / max) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '100px' }}>
                  <div 
                    className={`${colorClasses[color]} rounded-t absolute bottom-0 w-full transition-all duration-300`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(item.date).toLocaleDateString('en', { day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const conversionRate = data.overview.leadStats.totalLeads > 0 
    ? (data.overview.leadStats.closedLeads / data.overview.leadStats.totalLeads * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Views"
          value={data.overview.vehicleViews.totalViews}
          icon={Eye}
          color="blue"
        />
        <StatCard
          title="Unique Visitors"
          value={data.overview.vehicleViews.uniqueVisitors}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Total Leads"
          value={data.overview.leadStats.totalLeads}
          icon={Target}
          color="purple"
        />
        <StatCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MiniChart 
          data={data.dailyTrends} 
          title="Daily Vehicle Views" 
          color="blue"
        />
        
        {/* Lead Funnel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Lead Conversion Funnel</h3>
          <div className="space-y-3">
            {[
              { label: 'New Leads', value: data.overview.leadStats.newLeads, color: 'bg-blue-500' },
              { label: 'Contacted', value: data.overview.leadStats.contactedLeads, color: 'bg-yellow-500' },
              { label: 'Qualified', value: data.overview.leadStats.qualifiedLeads, color: 'bg-purple-500' },
              { label: 'Closed', value: data.overview.leadStats.closedLeads, color: 'bg-green-500' }
            ].map((stage, index) => {
              const width = data.overview.leadStats.totalLeads > 0 
                ? (stage.value / data.overview.leadStats.totalLeads) * 100 
                : 0;
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{stage.label}</span>
                    <span className="font-semibold">{stage.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${stage.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Vehicles */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Car className="h-5 w-5 mr-2 text-blue-500" />
            Top Viewed Vehicles
          </h3>
          <div className="space-y-2">
            {data.topVehicles.slice(0, 5).map((vehicle, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {vehicle.viewCount} views
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Searches */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2 text-green-500" />
            Popular Searches
          </h3>
          <div className="space-y-2">
            {data.popularSearches.slice(0, 5).map((search, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                <p className="text-sm truncate flex-1">{search.query}</p>
                <span className="text-sm font-semibold text-green-600 ml-2">
                  {search.count}x
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-purple-500" />
            Traffic Sources
          </h3>
          <div className="space-y-2">
            {data.referrerStats.map((source, index) => {
              const total = data.referrerStats.reduce((sum, s) => sum + s.count, 0);
              const percentage = total > 0 ? (source.count / total * 100).toFixed(1) : 0;
              return (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                  <p className="text-sm">{source.source}</p>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-purple-600">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Staff Performance */}
      {data.staffPerformance.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Staff Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Staff Member</th>
                  <th className="text-center py-2 text-sm font-medium text-gray-600">Total Leads</th>
                  <th className="text-center py-2 text-sm font-medium text-gray-600">Closed Deals</th>
                  <th className="text-center py-2 text-sm font-medium text-gray-600">Conversion</th>
                  <th className="text-center py-2 text-sm font-medium text-gray-600">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {data.staffPerformance.map((staff, index) => {
                  const conversion = staff.totalLeads > 0 
                    ? (staff.closedLeads / staff.totalLeads * 100).toFixed(1)
                    : '0';
                  return (
                    <tr key={index} className="border-b">
                      <td className="py-3 text-sm">{staff.assigned_to || 'Unassigned'}</td>
                      <td className="py-3 text-sm text-center">{staff.totalLeads}</td>
                      <td className="py-3 text-sm text-center font-semibold text-green-600">
                        {staff.closedLeads}
                      </td>
                      <td className="py-3 text-sm text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {conversion}%
                        </span>
                      </td>
                      <td className="py-3 text-sm text-center">{Math.round(staff.avgScore)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
