import TeacherDashboard from '@/pages/TeacherDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Suspense } from 'react';

export default function TeacherDashboardPage() {
    return (
        <ProtectedRoute requiredRole="TEACHER">
            <Suspense fallback={<div>Loading...</div>}>
                <TeacherDashboard />
            </Suspense>
        </ProtectedRoute>
    );
}
