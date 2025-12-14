'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev'}/api/auth/verify`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.authenticated) {
        setAuthenticated(true);
        setUser(data.user);
        setLoading(false);
      } else {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
