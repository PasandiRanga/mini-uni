'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatePostModal } from '@/contexts/CreatePostModalContext';

// The create-post experience is now a floating modal. This legacy route stays
// for bookmarked / direct links: it opens the modal and sends the user to a
// sensible page behind it.
export default function CreatePostPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { openCreatePost } = useCreatePostModal();
    const opened = useRef(false);

    useEffect(() => {
        if (opened.current) return;
        opened.current = true;
        const editId = searchParams?.get('editId') || searchParams?.get('id');
        const dest = user?.role === 'TEACHER' ? '/teacher/dashboard?tab=posts' : '/feed';
        router.replace(dest);
        openCreatePost(editId);
    }, [router, searchParams, user, openCreatePost]);

    return null;
}
