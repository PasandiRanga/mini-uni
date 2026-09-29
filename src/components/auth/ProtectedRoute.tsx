'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

// Where each role belongs when it lands on a page meant for someone else.
const homeForRole = (role: string) =>
  role === 'TEACHER' ? '/teacher/dashboard' : role === 'ADMIN' ? '/admin' : '/student/dashboard';

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace('/auth');
      } else if (requiredRole && user.role !== requiredRole) {
        // Wrong role for this page — send them to their own dashboard, not home,
        // so a teacher never lingers on a student page (and vice versa).
        router.replace(homeForRole(user.role));
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
