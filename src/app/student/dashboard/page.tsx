import StudentDashboard from '@/views/StudentDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Suspense } from 'react';

export default function StudentDashboardPage() {
    return (
        <ProtectedRoute requiredRole="STUDENT">
            <Suspense fallback={<div>Loading...</div>}>
                <StudentDashboard />
            </Suspense>
        </ProtectedRoute>
    );
}
