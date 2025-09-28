'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Phone, 
  Mail, 
  MessageSquare,
  Calendar,
  Star,
  Filter,
  Search,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Car,
  X,
  ChevronRight,
  User
} from 'lucide-react';
import { fetchAnalytics, ANALYTICS_ENDPOINTS } from '@/lib/analytics-config';

interface Lead {
  id: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePrice: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string;
  inquiryType: string;
  preferredContact: string;
  leadScore: number;
  status: string;
  source: string;
  timestamp: string;
  assignedTo?: string;
  followUpDate?: string;
  notes?: string;
}

interface LeadAnalytics {
  totalLeads: number;
  averageLeadScore: number;
  statusDistribution: Record<string, number>;
  topInquiryTypes: { type: string; count: number }[];
  leadSources: { source: string; count: number }[];
  highValueLeads: Lead[];
  recentLeads: Lead[];
  dailyLeads: { date: string; leads: number }[];
  topVehicleInterest: {
    vehicle: string;
    vehicleId: string;
    price: number;
    inquiries: number;
    averageScore: number;
  }[];
  conversionRate: number;
}

export default function LeadsManagement() {
  const [leads, setLeads] = useState<LeadAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [timeRange, statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { timeRange };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const data = await fetchAnalytics(ANALYTICS_ENDPOINTS.LEADS, params);
      setLeads(data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      // Set fallback data
      setLeads({
        totalLeads: 0,
        averageLeadScore: 0,
        statusDistribution: {},
        topInquiryTypes: [],
        leadSources: [],
        highValueLeads: [],
        recentLeads: [],
        dailyLeads: [],
        topVehicleInterest: [],
        conversionRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    // In a real implementation, this would update the lead status via API
    console.log('Updating lead', leadId, 'to status', newStatus);
    // Refresh leads after update
    await fetchLeads();
  };

  const assignLead = async (leadId: string, staffMember: string) => {
    // In a real implementation, this would assign the lead via API
    console.log('Assigning lead', leadId, 'to', staffMember);
    // Refresh leads after assignment
    await fetchLeads();
  };

  const exportLeads = () => {
    if (!leads || !leads.recentLeads) return;
    
    const csv = [
      ['ID', 'Customer Name', 'Email', 'Phone', 'Vehicle', 'Price', 'Score', 'Status', 'Date'],
      ...leads.recentLeads.map(lead => [
        lead.id,
        lead.customerName,
        lead.customerEmail,
        lead.customerPhone,
        `${lead.vehicleYear} ${lead.vehicleMake} ${lead.vehicleModel}`,
        lead.vehiclePrice,
        lead.leadScore,
        lead.status,
        new Date(lead.timestamp).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'negotiating': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading leads...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lead Management</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={exportLeads}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold">{leads?.totalLeads || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold">{leads?.averageLeadScore || 0}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion</p>
              <p className="text-2xl font-bold">{leads?.conversionRate || 0}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Today</p>
              <p className="text-2xl font-bold">
                {leads?.dailyLeads?.[leads.dailyLeads.length - 1]?.leads || 0}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Value</p>
              <p className="text-2xl font-bold">{leads?.highValueLeads?.length || 0}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="negotiating">Negotiating</option>
            <option value="closed">Closed</option>
            <option value="lost">Lost</option>
          </select>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTimeRange('7d');
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center space-x-1"
          >
            <X className="h-4 w-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Recent Leads</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {leads?.recentLeads?.map((lead) => (
                <div
                  key={lead.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedLead(lead);
                    setShowDetails(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900">{lead.customerName}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(lead.leadScore)}`}>
                          {lead.leadScore}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {lead.vehicleYear} {lead.vehicleMake} {lead.vehicleModel} - ${lead.vehiclePrice.toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {lead.customerEmail}
                        </span>
                        <span className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {lead.customerPhone}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(lead.timestamp)}
                        </span>
                      </div>
                      {lead.message && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{lead.message}</p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                  </div>
                </div>
              ))}
              {(!leads?.recentLeads || leads.recentLeads.length === 0) && (
                <div className="p-8 text-center text-gray-500">
                  No leads found for the selected criteria
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Top Vehicles */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Top Vehicle Interest</h2>
            </div>
            <div className="p-4">
              {leads?.topVehicleInterest?.map((vehicle, index) => (
                <div key={index} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{vehicle.vehicle}</span>
                    <span className="text-sm text-gray-600">{vehicle.inquiries} leads</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(vehicle.inquiries / (leads?.topVehicleInterest?.[0]?.inquiries || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">Score: {vehicle.averageScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lead Sources */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Lead Sources</h2>
            </div>
            <div className="p-4">
              {leads?.leadSources?.map((source, index) => (
                <div key={index} className="flex items-center justify-between mb-2">
                  <span className="text-sm">{source.source}</span>
                  <span className="text-sm font-medium">{source.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Pipeline Status</h2>
            </div>
            <div className="p-4">
              {Object.entries(leads?.statusDistribution || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {status}
                  </span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lead Details Modal */}
      {showDetails && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Lead Details</h2>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedLead(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedLead.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedLead.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{selectedLead.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Preferred Contact</p>
                    <p className="font-medium">{selectedLead.preferredContact}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Vehicle Interest</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">
                    {selectedLead.vehicleYear} {selectedLead.vehicleMake} {selectedLead.vehicleModel}
                  </p>
                  <p className="text-lg font-bold text-green-600">${selectedLead.vehiclePrice.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Vehicle ID: {selectedLead.vehicleId}</p>
                </div>
              </div>

              {/* Lead Details */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Lead Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Inquiry Type</p>
                    <p className="font-medium">{selectedLead.inquiryType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lead Score</p>
                    <p className={`font-bold text-lg ${getScoreColor(selectedLead.leadScore)}`}>
                      {selectedLead.leadScore}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Source</p>
                    <p className="font-medium">{selectedLead.source}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{new Date(selectedLead.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedLead.message && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Message</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm">{selectedLead.message}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <select
                  value={selectedLead.status}
                  onChange={(e) => updateLeadStatus(selectedLead.id, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="closed">Closed</option>
                  <option value="lost">Lost</option>
                </select>
                
                <div className="flex items-center space-x-2">
                  <a
                    href={`mailto:${selectedLead.customerEmail}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </a>
                  <a
                    href={`tel:${selectedLead.customerPhone}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
