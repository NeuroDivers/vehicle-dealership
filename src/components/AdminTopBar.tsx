'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, X } from 'lucide-react';

export default function AdminTopBar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    setIsAdmin(!!token);
  }, []);

  if (!isAdmin || !isVisible) {
    return null;
  }

  return (
    <div className="bg-gray-900 text-white py-2 px-4 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-sm font-medium">Admin Mode</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded transition-colors"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Hide admin bar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
