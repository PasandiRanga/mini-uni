import StudentDashboard from '@/pages/StudentDashboard';
import { Suspense } from 'react';

export default function StudentDashboardPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <StudentDashboard />
        </Suspense>
    );
}
