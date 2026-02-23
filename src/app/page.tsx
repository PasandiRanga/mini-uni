'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Index from '../pages/Index';

export default function Home() {
    const { isAuthenticated, user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated && user) {
            const dashboardPath = user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';
            router.replace(dashboardPath);
        }
    }, [isAuthenticated, user, isLoading, router]);

    if (isLoading || (isAuthenticated && user)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <Index />;
}
