import FindTeacher from '@/views/FindTeacher';
import { Suspense } from 'react';

export default function TeachersPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <FindTeacher />
        </Suspense>
    );
}
