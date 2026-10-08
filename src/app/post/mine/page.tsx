import MyPosts from '@/views/MyPosts';
import { Suspense } from 'react';

export default function MyPostsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MyPosts />
        </Suspense>
    );
}
