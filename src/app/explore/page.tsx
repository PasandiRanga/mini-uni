import Explore from '@/views/Explore';
import { Suspense } from 'react';

export default function ExplorePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Explore />
        </Suspense>
    );
}
