import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute: Guards pages that should only be accessible to guests (not authenticated users).
 * If a user is authenticated, they are redirected to their dashboard.
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const dashboardPath = user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';
      router.replace(dashboardPath);
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated, we've already triggered a redirect in useEffect
  if (isAuthenticated && user) {
    return null;
  }

  return <>{children}</>;
};

export default PublicRoute;
