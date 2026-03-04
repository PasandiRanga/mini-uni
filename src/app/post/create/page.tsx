import CreatePost from '@/pages/CreatePost';
import { Suspense } from 'react';

export default function CreatePostPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreatePost />
        </Suspense>
    );
}
