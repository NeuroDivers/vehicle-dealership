'use client';

import { useState, useEffect } from 'react';
import { 
  Users,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Shield,
  Calendar,
  Search,
  Filter,
  X,
  CheckCircle,
  XCircle,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'sales' | 'staff';
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  image?: string;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Protected dev user ID
  const PROTECTED_USER_ID = 'dev-1759282417863-eahhg7zr9';
  
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUserId(user.id || '');
  }, []);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff' as 'admin' | 'manager' | 'sales' | 'staff',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev'}/api/staff`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Map the data to match our interface
        const mappedStaff = data.map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone || '',
          role: member.role,
          isActive: member.is_active === 1,
          lastLogin: member.last_login,
          createdAt: member.created_at
        }));
        setStaff(mappedStaff);
      } else {
        console.error('Failed to fetch staff');
        setStaff([]);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev'}/api/staff`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            password: formData.password
          })
        }
      );
      
      if (response.ok) {
        // Reset form and close modal
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: 'staff',
          password: '',
          confirmPassword: ''
        });
        setShowAddModal(false);
        
        // Refresh staff list
        await fetchStaff();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add staff member');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Failed to add staff member');
    }
  };

  const handleEditStaff = async () => {
    if (!selectedStaff) return;
    
    // Validate passwords if provided
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      
      // Build update object - only include fields that should be updated
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role
      };
      
      // Only include password if it was provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev'}/api/staff/${selectedStaff.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        }
      );
      
      if (response.ok) {
        // Reset form and close modal
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: 'staff',
          password: '',
          confirmPassword: ''
        });
        setShowEditModal(false);
        setSelectedStaff(null);
        
        // Refresh staff list
        await fetchStaff();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      alert('Failed to update staff member');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev'}/api/staff/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        // Refresh staff list
        await fetchStaff();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to delete staff member');
    }
  };

  const handleToggleActive = async (staffMember: StaffMember) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev'}/api/staff/${staffMember.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            is_active: staffMember.isActive ? 0 : 1
          })
        }
      );
      
      if (response.ok) {
        // Refresh staff list
        await fetchStaff();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update staff status');
      }
    } catch (error) {
      console.error('Error toggling staff status:', error);
      alert('Failed to update staff status');
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = searchTerm === '' || 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'sales': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLastLogin = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return time.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading staff...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <UserPlus className="h-5 w-5" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold">{staff.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {staff.filter(s => s.isActive).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Managers</p>
              <p className="text-2xl font-bold">
                {staff.filter(s => s.role === 'manager' || s.role === 'admin').length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sales Team</p>
              <p className="text-2xl font-bold">
                {staff.filter(s => s.role === 'sales').length}
              </p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="sales">Sales</option>
            <option value="staff">Staff</option>
          </select>
          
          <button
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center space-x-1"
          >
            <X className="h-4 w-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">ID: {member.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.email}</div>
                    {member.phone && (
                      <div className="text-sm text-gray-500">{member.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(member)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {member.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatLastLogin(member.lastLogin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      {/* Edit button - only allow if not protected user OR if current user is the protected user */}
                      {(member.id !== PROTECTED_USER_ID || currentUserId === PROTECTED_USER_ID) && (
                        <button
                          onClick={() => {
                            setSelectedStaff(member);
                            setFormData({
                              name: member.name,
                              email: member.email,
                              phone: member.phone || '',
                              role: member.role,
                              password: '',
                              confirmPassword: ''
                            });
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit staff"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* Delete button - hide for protected user */}
                      {member.id !== PROTECTED_USER_ID ? (
                        <button
                          onClick={() => handleDeleteStaff(member.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete staff"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span>Protected</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStaff.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No staff members found
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Add Staff Member</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      role: 'staff',
                      password: '',
                      confirmPassword: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="staff">Staff</option>
                    <option value="sales">Sales</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      role: 'staff',
                      password: '',
                      confirmPassword: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStaff}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Edit Staff Member</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedStaff(null);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      role: 'staff',
                      password: '',
                      confirmPassword: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="staff">Staff</option>
                    <option value="sales">Sales</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Leave password fields empty to keep current password</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedStaff(null);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      role: 'staff',
                      password: '',
                      confirmPassword: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditStaff}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
