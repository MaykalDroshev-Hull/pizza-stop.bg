"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getAccessToken, clearAuth } from '@/utils/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }): React.JSX.Element => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') return;
      
      const authenticated = isAuthenticated();
      const hasToken = getAccessToken() !== null;
      
      // If user is marked as authenticated but doesn't have a token,
      // they logged in before the JWT token update - force re-login
      if (authenticated && !hasToken) {
        clearAuth();
        router.push('/login-admin');
        return;
      }
      
      if (!authenticated) {
        router.push('/login-admin');
        return;
      }

      // Verify token with backend
      if (hasToken) {
        try {
          const token = getAccessToken();
          const response = await fetch('/api/administraciq/products', {
            method: 'GET',
            headers: {
              'x-admin-auth': token!
            }
          });

          // If unauthorized, clear auth and redirect
          if (response.status === 401 || response.status === 403) {
            clearAuth();
            router.push('/login-admin');
            return;
          }

          // If request succeeds, user is authorized
          if (response.ok) {
            setIsAuthorized(true);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          // On error, clear auth and redirect
          clearAuth();
          router.push('/login-admin');
          return;
        }
      }
      
      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-gray-400 text-sm">Проверка на достъпа...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Неоторизиран достъп</p>
          <p className="text-gray-400 text-sm">Пренасочване към страницата за вход...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;