import AdminDashboard from '@/views/AdminDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Suspense } from 'react';

export default function AdminPage() {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            <Suspense fallback={<div>Loading...</div>}>
                <AdminDashboard />
            </Suspense>
        </ProtectedRoute>
    );
}
