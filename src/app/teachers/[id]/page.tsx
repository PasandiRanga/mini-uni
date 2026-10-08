'use client';

import TeacherProfile from '@/views/TeacherProfile';
import { useParams } from 'next/navigation';

export default function TeacherProfilePage() {
    const params = useParams();
    if (!params) return null;
    return <TeacherProfile id={params.id as string} />;
}
