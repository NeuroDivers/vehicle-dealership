'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Star,
  Clock,
  User,
  Car,
  DollarSign,
  ChevronRight,
  X,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  UserPlus,
  Search
} from 'lucide-react';

interface Lead {
  id: string;
  vehicle_id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_price: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  message?: string;
  inquiry_type: string;
  preferred_contact: string;
  lead_score: number;
  status: 'new' | 'contacted' | 'qualified' | 'negotiating' | 'closed' | 'lost';
  source: string;
  timestamp: string;
  assigned_to?: string;
  follow_up_date?: string;
  notes?: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
}

const PIPELINE_STAGES = [
  { id: 'new', title: 'New Leads', color: 'bg-blue-500', icon: AlertCircle },
  { id: 'contacted', title: 'Contacted', color: 'bg-yellow-500', icon: Phone },
  { id: 'qualified', title: 'Qualified', color: 'bg-purple-500', icon: CheckCircle },
  { id: 'negotiating', title: 'Negotiating', color: 'bg-orange-500', icon: TrendingUp },
  { id: 'closed', title: 'Closed Won', color: 'bg-green-500', icon: DollarSign },
  { id: 'lost', title: 'Lost', color: 'bg-red-500', icon: X }
];

export default function LeadPipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScore, setFilterScore] = useState(0);
  const [filterAssignee, setFilterAssignee] = useState('all');

  useEffect(() => {
    fetchLeads();
    fetchStaff();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-analytics.nick-damato0011527.workers.dev'}/api/leads`
      );
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array
        if (Array.isArray(data)) {
          setLeads(data);
        } else if (data && Array.isArray(data.results)) {
          setLeads(data.results);
        } else {
          setLeads([]);
        }
      } else {
        setLeads([]);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-analytics.nick-damato0011527.workers.dev'}/api/staff`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array
        if (Array.isArray(data)) {
          setStaff(data);
        } else if (data && Array.isArray(data.results)) {
          setStaff(data.results);
        } else {
          setStaff([]);
        }
      } else {
        setStaff([]);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      setStaff([]);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-analytics.nick-damato0011527.workers.dev'}/api/leads/${leadId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        }
      );
      
      if (response.ok) {
        setLeads(prev => prev.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus as Lead['status'] } : lead
        ));
      }
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
  };

  const assignLead = async (leadId: string, staffId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-analytics.nick-damato0011527.workers.dev'}/api/leads/${leadId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ assigned_to: staffId })
        }
      );
      
      if (response.ok) {
        setLeads(prev => prev.map(lead => 
          lead.id === leadId ? { ...lead, assigned_to: staffId } : lead
        ));
      }
    } catch (error) {
      console.error('Failed to assign lead:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(null);
    
    if (draggedLead && draggedLead.status !== stageId) {
      await updateLeadStatus(draggedLead.id, stageId);
    }
    
    setDraggedLead(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === '' || 
      lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${lead.vehicle_year} ${lead.vehicle_make} ${lead.vehicle_model}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesScore = lead.lead_score >= filterScore;
    const matchesAssignee = filterAssignee === 'all' || 
      (filterAssignee === 'unassigned' && !lead.assigned_to) ||
      lead.assigned_to === filterAssignee;
    
    return matchesSearch && matchesScore && matchesAssignee;
  });

  const getLeadsByStage = (stageId: string) => {
    return filteredLeads.filter(lead => lead.status === stageId);
  };

  const LeadCard = ({ lead }: { lead: Lead }) => {
    const assignedStaff = staff.find(s => s.id === lead.assigned_to);
    
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, lead)}
        onClick={() => {
          setSelectedLead(lead);
          setShowLeadModal(true);
        }}
        className="bg-white rounded-lg shadow-sm p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
      >
        {/* Lead Score Badge */}
        <div className="flex justify-between items-start mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getScoreColor(lead.lead_score)}`}>
            Score: {lead.lead_score}
          </span>
          <span className="text-xs text-gray-500">{formatTimeAgo(lead.timestamp)}</span>
        </div>

        {/* Customer Info */}
        <h4 className="font-semibold text-gray-900 mb-1">{lead.customer_name}</h4>
        
        {/* Vehicle Info */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Car className="h-3 w-3 mr-1" />
          <span>{lead.vehicle_year} {lead.vehicle_make} {lead.vehicle_model}</span>
        </div>

        {/* Price */}
        <div className="flex items-center text-sm font-semibold text-gray-900 mb-2">
          <DollarSign className="h-3 w-3" />
          <span>{lead.vehicle_price.toLocaleString()}</span>
        </div>

        {/* Contact Preference */}
        <div className="flex items-center gap-2 mb-2">
          {lead.preferred_contact === 'email' && <Mail className="h-3 w-3 text-gray-400" />}
          {lead.preferred_contact === 'phone' && <Phone className="h-3 w-3 text-gray-400" />}
          <span className="text-xs text-gray-500">{lead.inquiry_type}</span>
        </div>

        {/* Assignee */}
        {assignedStaff ? (
          <div className="flex items-center text-xs text-gray-600 mt-2 pt-2 border-t">
            <User className="h-3 w-3 mr-1" />
            <span>{assignedStaff.name}</span>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Quick assign to current user
              const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
              if (currentUser.id) {
                assignLead(lead.id, currentUser.id);
              }
            }}
            className="flex items-center text-xs text-blue-600 hover:text-blue-800 mt-2 pt-2 border-t w-full"
          >
            <UserPlus className="h-3 w-3 mr-1" />
            <span>Assign to me</span>
          </button>
        )}
      </div>
    );
  };

  const LeadModal = () => {
    if (!selectedLead) return null;
    
    const assignedStaff = staff.find(s => s.id === selectedLead.assigned_to);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b sticky top-0 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{selectedLead.customer_name}</h2>
                <p className="text-gray-600">{selectedLead.customer_email}</p>
              </div>
              <button
                onClick={() => {
                  setShowLeadModal(false);
                  setSelectedLead(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`tel:${selectedLead.customer_phone}`} className="text-blue-600 hover:underline">
                        {selectedLead.customer_phone}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`mailto:${selectedLead.customer_email}`} className="text-blue-600 hover:underline">
                        {selectedLead.customer_email}
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Vehicle Interest</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Car className="h-5 w-5 mr-2 text-gray-600" />
                      <span className="font-medium">
                        {selectedLead.vehicle_year} {selectedLead.vehicle_make} {selectedLead.vehicle_model}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-gray-600" />
                      <span className="text-xl font-bold">${selectedLead.vehicle_price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Lead Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lead Score:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getScoreColor(selectedLead.lead_score)}`}>
                        {selectedLead.lead_score}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Source:</span>
                      <span className="font-medium">{selectedLead.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inquiry Type:</span>
                      <span className="font-medium">{selectedLead.inquiry_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preferred Contact:</span>
                      <span className="font-medium capitalize">{selectedLead.preferred_contact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedLead.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Assignment</h3>
                  <select
                    value={selectedLead.assigned_to || ''}
                    onChange={(e) => {
                      assignLead(selectedLead.id, e.target.value);
                      setSelectedLead({ ...selectedLead, assigned_to: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {staff.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => {
                      updateLeadStatus(selectedLead.id, e.target.value);
                      setSelectedLead({ ...selectedLead, status: e.target.value as Lead['status'] });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PIPELINE_STAGES.map(stage => (
                      <option key={stage.id} value={stage.id}>
                        {stage.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedLead.message && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Customer Message</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedLead.message}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                  <textarea
                    value={selectedLead.notes || ''}
                    onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                    placeholder="Add notes about this lead..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  />
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </button>
                  <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Lead Pipeline</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
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
          </div>
          
          <select
            value={filterScore}
            onChange={(e) => setFilterScore(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>All Scores</option>
            <option value={40}>Score ≥ 40</option>
            <option value={60}>Score ≥ 60</option>
            <option value={80}>Score ≥ 80</option>
          </select>
          
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {staff.map(member => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pipeline */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const stageLeads = getLeadsByStage(stage.id);
          const StageIcon = stage.icon;
          
          return (
            <div
              key={stage.id}
              className={`flex-1 min-w-[300px] ${
                dragOverStage === stage.id ? 'ring-2 ring-blue-400' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className={`${stage.color} text-white p-3 rounded-t-lg`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <StageIcon className="h-5 w-5 mr-2" />
                    <h3 className="font-semibold">{stage.title}</h3>
                  </div>
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                    {stageLeads.length}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 min-h-[400px] p-3 rounded-b-lg">
                {stageLeads.map(lead => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
                
                {stageLeads.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <p className="text-sm">No leads in this stage</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Modal */}
      {showLeadModal && <LeadModal />}
    </div>
  );
}
