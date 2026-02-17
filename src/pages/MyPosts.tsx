/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Footer from '@/components/layout/Footer';
import { useToast } from '@/hooks/use-toast';

const MyPosts: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${base}/api/posts/mine`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setPosts(await res.json());
      } catch (e) { console.error(e); }
    })();
  }, [isAuthenticated, token]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${base}/api/posts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Delete failed');
      setPosts(p => p.filter(x => x.id !== id));
      toast({ title: 'Deleted', description: 'Post removed' });
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message || 'Failed' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardLayout>
        <main className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Posts</h2>
            <Button onClick={() => navigate('/post/create')}>Create Post</Button>
          </div>
          <div className="space-y-4">
            {posts.length === 0 && <div className="bg-card p-4 rounded">You have no posts yet.</div>}
            {posts.map(p => (
              <div key={p.id} className="bg-card p-4 rounded flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{p.title}</h3>
                    <Badge className="text-sm">{p.type === 'STUDENT_REQUEST' ? 'Looking for a Teacher' : 'Offering a Class'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.subject} {p.grade ? `• ${p.grade}` : ''}</p>
                  <p className="mt-2 text-sm">{p.description?.slice(0, 200)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" onClick={() => navigate(`/post/create?id=${p.id}`)}>Edit</Button>
                  <Button variant="destructive" onClick={() => handleDelete(p.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </DashboardLayout>
      <Footer />
    </div>
  );
};

export default MyPosts;
