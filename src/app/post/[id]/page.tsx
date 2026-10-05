'use client';

import PostPage from '@/pages/PostPage';
import { useParams } from 'next/navigation';

export default function PostDetailPage() {
    const params = useParams();
    if (!params) return null;
    return <PostPage id={params.id as string} />;
}
