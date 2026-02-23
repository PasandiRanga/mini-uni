import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Star, Mail } from "lucide-react";
import { InquiryDialog } from "@/components/teachers/InquiryDialog";

type TeacherDetail = {
  id: string;
  firstName: string;
  lastName: string;
  subjects?: string[];
  city?: string;
  rating?: number;
  startingPrice?: number;
  verified?: boolean;
  bio?: string;
  qualifications?: string[];
};

const TeacherProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/teachers/${id}`);
        if (res.ok) {
          const data = await res.json();
          setTeacher(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/posts?teacherId=${id}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchDetail();
    fetchPosts();
  }, [id]);

  if (!teacher) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">Loading...</main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-card p-6 rounded-2xl">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground font-semibold text-2xl">{teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{teacher.firstName} {teacher.lastName}</h2>
                <Badge variant={teacher.verified ? 'secondary' : 'outline'}>{teacher.verified ? 'Verified' : 'Unverified'}</Badge>
              </div>
              <div className="text-muted-foreground mt-1">{teacher.subjects?.join(', ')}</div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2"><Star className="w-4 h-4" />{teacher.rating ?? '—'}</div>
                <div className="text-muted-foreground">{teacher.city}</div>
                <div className="text-muted-foreground">Starting at ${teacher.startingPrice ?? '—'}</div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{teacher.bio}</p>
              <div className="flex gap-3 mt-4">
                {user?.role === 'STUDENT' || isGuest ? (
                  <>
                    <Button onClick={() => {
                      if (!isAuthenticated) {
                        toast({ title: 'Sign in to message', description: 'Please sign in before sending inquiries.' });
                        router.push('/auth');
                        return;
                      }
                      setIsInquiryOpen(true);
                    }}><Mail className="w-4 h-4 mr-2" />Message</Button>
                    <Button onClick={() => { if (!isAuthenticated) { toast({ title: 'Sign in to book', description: 'Please sign in before booking.' }); router.push('/auth'); return; } router.push(`/teachers/${teacher.id}/book`); }}>Book</Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">You are viewing this as a teacher. Student interactions are disabled.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Qualifications</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
              {(teacher.qualifications || []).map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Recent posts</h3>
            <div className="grid gap-3 mt-3">
              {posts.map(p => (
                <div key={p.id} className="p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-sm text-muted-foreground">{p.excerpt || p.description?.substring(0, 100) + '...'}</div>
                </div>
              ))}
              {posts.length === 0 && <div className="text-sm text-muted-foreground">No posts yet.</div>}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <InquiryDialog
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        teacherId={teacher.id}
        teacherName={`${teacher.firstName} ${teacher.lastName}`}
        posts={posts}
      />
    </div>
  );
};

export default TeacherProfile;
