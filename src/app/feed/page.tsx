import Feed from '@/pages/Feed';
import { Suspense } from 'react';

export default function FeedPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Feed />
        </Suspense>
    );
}
