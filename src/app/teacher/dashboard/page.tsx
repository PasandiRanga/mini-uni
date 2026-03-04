import TeacherDashboard from '@/pages/TeacherDashboard';
import { Suspense } from 'react';

export default function TeacherDashboardPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TeacherDashboard />
        </Suspense>
    );
}
