import { redirect } from 'next/navigation';

// The old feed was replaced by Explore; keep old links working.
export default function FeedPage() {
    redirect('/explore');
}
