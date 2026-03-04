import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Index from './Index';

/**
 * RootRedirect: Smart root path handler.
 * - If authenticated: redirect to user's dashboard (student or teacher)
 * - If guest: show the public landing page
 */
const RootRedirect: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const dashboardPath = user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';
      router.replace(dashboardPath);
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If guest, show landing page
  return <Index />;
};

export default RootRedirect;
