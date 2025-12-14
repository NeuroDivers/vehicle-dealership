'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Car,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Star,
  User,
  MessageSquare,
  BarChart3,
  FileText,
  Image
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem('auth_token');
    
    // Call logout API to clear HttpOnly cookie
    await fetch(`${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev'}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Include cookies in request
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    // Redirect to login
    router.push('/admin/login');
  };

  // Don't show navigation on login page
  if (pathname === '/admin/login') {
    return (
      <div className="min-h-screen bg-gray-100">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Navigation */}
      <nav className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="hidden md:flex space-x-4">
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded flex items-center space-x-1 ${
                    pathname === '/admin' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/admin/vehicles"
                  className={`px-3 py-2 rounded flex items-center space-x-1 ${
                    pathname.startsWith('/admin/vehicles') ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <Car className="h-4 w-4" />
                  <span>Vehicles</span>
                </Link>
                <Link
                  href="/admin/leads"
                  className={`px-3 py-2 rounded flex items-center space-x-1 ${
                    pathname === '/admin/leads' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Leads</span>
                </Link>
                <Link
                  href="/admin/reviews"
                  className={`px-3 py-2 rounded flex items-center space-x-1 ${
                    pathname === '/admin/reviews' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <Star className="h-4 w-4" />
                  <span>Reviews</span>
                </Link>
                <Link
                  href="/admin/staff"
                  className={`px-3 py-2 rounded flex items-center space-x-1 ${
                    pathname === '/admin/staff' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <span>Staff</span>
                </Link>
                <Link
                  href="/admin/analytics"
                  className={`px-3 py-2 rounded flex items-center space-x-1 ${
                    pathname === '/admin/analytics' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </Link>
                <Link
                  href="/admin/reports"
                  className={`px-3 py-2 rounded flex items-center space-x-1 ${
                    pathname === '/admin/reports' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Reports</span>
                </Link>
                {/* Dev-only section */}
                {user?.role === 'dev' && (
                  <Link
                    href="/admin/cloudflare-images"
                    className={`px-3 py-2 rounded flex items-center space-x-1 ${
                      pathname === '/admin/cloudflare-images' ? 'bg-gray-700' : 'hover:bg-gray-700'
                    }`}
                  >
                    <Image className="h-4 w-4" />
                    <span>Dev</span>
                  </Link>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <div className="hidden md:flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                  <span className="text-gray-400">({user.role})</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center space-x-2 hover:bg-gray-700 px-3 py-2 rounded"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden"
              >
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-700">
            <div className="px-2 py-3 space-y-1">
              {user && (
                <div className="px-3 py-2 text-sm border-b border-gray-700">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{user.name}</span>
                  </div>
                  <div className="text-gray-400 text-xs mt-1">{user.role}</div>
                </div>
              )}
              <Link
                href="/admin"
                className="block px-3 py-2 rounded hover:bg-gray-700"
                onClick={() => setShowMobileMenu(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/vehicles"
                className="block px-3 py-2 rounded hover:bg-gray-700"
                onClick={() => setShowMobileMenu(false)}
              >
                Vehicles
              </Link>
              <Link
                href="/admin/leads"
                className="block px-3 py-2 rounded hover:bg-gray-700"
                onClick={() => setShowMobileMenu(false)}
              >
                Leads
              </Link>
              <Link
                href="/admin/reviews"
                className="block px-3 py-2 rounded hover:bg-gray-700"
                onClick={() => setShowMobileMenu(false)}
              >
                Reviews
              </Link>
              <Link
                href="/admin/staff"
                className="block px-3 py-2 rounded hover:bg-gray-700"
                onClick={() => setShowMobileMenu(false)}
              >
                Staff
              </Link>
              <Link
                href="/admin/analytics"
                className="block px-3 py-2 rounded hover:bg-gray-700"
                onClick={() => setShowMobileMenu(false)}
              >
                Analytics
              </Link>
              <Link
                href="/admin/reports"
                className="block px-3 py-2 rounded hover:bg-gray-700"
                onClick={() => setShowMobileMenu(false)}
              >
                Reports
              </Link>
              {/* Dev-only section */}
              {user?.role === 'dev' && (
                <Link
                  href="/admin/cloudflare-images"
                  className="block px-3 py-2 rounded hover:bg-gray-700"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Dev
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AuthGuard>
          {children}
        </AuthGuard>
      </main>
    </div>
  );
}
