'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't check auth on login page
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev'}/api/auth/verify`,
        {
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        setUser(data.user);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
        if (pathname?.startsWith('/admin') && pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setLoading(false);
      if (pathname?.startsWith('/admin') && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    }
  };

  const logout = async () => {
    await fetch(
      `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev'}/api/auth/logout`,
      {
        method: 'POST',
        credentials: 'include'
      }
    );
    
    setUser(null);
    router.push('/admin/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
