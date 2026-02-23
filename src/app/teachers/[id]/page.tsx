'use client';

import TeacherProfile from '@/pages/TeacherProfile';
import { useParams } from 'next/navigation';

export default function TeacherProfilePage() {
    const params = useParams();
    return <TeacherProfile id={params.id as string} />;
}
