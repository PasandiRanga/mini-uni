/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getApiRoot } from '@/lib/api';
import Footer from '@/components/layout/Footer';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const CreatePost: React.FC = () => {
  const { isAuthenticated, user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isTeacherVerified, setIsTeacherVerified] = useState<boolean | null>(null);
  const [type, setType] = useState<'TEACHER_OFFERING' | 'STUDENT_REQUEST'>(() => 'TEACHER_OFFERING');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState<'GRADE'|'OL'|'AL'|'UNIVERSITY'>('GRADE');
  const [grade, setGrade] = useState('1');
  const [description, setDescription] = useState('');
  // Platform is online-only
  const [mode] = useState<'ONLINE'>('ONLINE');
  const [budgetMin, setBudgetMin] = useState<number | null>(null);
  const [budgetMax, setBudgetMax] = useState<number | null>(null);
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [pricePerClass, setPricePerClass] = useState<number | null>(null);
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const editId = query.get('id');

  const subjects = ['Mathematics','Physics','Chemistry','Biology','English','ICT','Commerce','History','Computer Science'];
  const gradeOptions = Array.from({length:13}).map((_,i) => String(i+1));
  const availabilityOptions = ['Mon AM','Mon PM','Tue AM','Tue PM','Wed AM','Wed PM','Thu AM','Thu PM','Fri AM','Fri PM','Sat AM','Sat PM'];

  useEffect(() => {
    if (!isAuthenticated) return;
    // If teacher, check verification
    const check = async () => {
      try {
        const apiRoot = getApiRoot();
        const res = await fetch(`${apiRoot}/teachers/verification-status`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const j = await res.json();
          setIsTeacherVerified(!!j.isVerified);
        }
      } catch (e) { console.error('verification-status fetch failed', e); }
    };
    check();
    // set default type based on role
    if (user?.role === 'STUDENT') setType('STUDENT_REQUEST');
    // If editing, fetch post
    if (editId) {
      (async () => {
        try {
          try {
            const apiRoot = getApiRoot();
            const res = await fetch(`${apiRoot}/posts/${editId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
              const p = await res.json();
              setSubject(p.subject || '');
              setDescription(p.description || '');
              if (p.grade) setGrade(p.grade as string);
              setType(p.type === 'TEACHER_OFFERING' ? 'TEACHER_OFFERING' : 'STUDENT_REQUEST');
              // load syllabus JSON for preferences if present
              if (p.syllabus) {
                try {
                  const s = JSON.parse(p.syllabus);
                  if (s.preferredTimes) setPreferredTimes(s.preferredTimes);
                  if (s.budgetMin) setBudgetMin(s.budgetMin);
                  if (s.budgetMax) setBudgetMax(s.budgetMax);
                  if (s.pricePerClass) setPricePerClass(s.pricePerClass);
                  if (s.availability) setPreferredTimes(s.availability || []);
                } catch (e) {
                  // ignore
                }
              }
            } else {
              console.warn('Failed to fetch post for editing', res.status);
            }
          } catch (e) {
            console.error('fetch post for editing failed', e);
          }
        } catch (e) { console.error(e); }
      })();
    }
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardLayout>
          <main className="container mx-auto p-8 text-center">Please sign in to create posts. <Button onClick={() => navigate('/auth')}>Sign in</Button></main>
        </DashboardLayout>
        <Footer />
      </div>
    );
  }

  if (user?.role === 'TEACHER' && isTeacherVerified === false) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardLayout>
          <main className="container mx-auto p-8">
            <div className="bg-card p-6 rounded-xl">
              <h2 className="text-xl font-semibold">Complete verification to start creating classes.</h2>
              <p className="mt-2">Your account must be verified. <Button variant="link" onClick={() => navigate('/teacher/onboarding')}>Go to onboarding</Button></p>
            </div>
          </main>
        </DashboardLayout>
        <Footer />
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiRoot = getApiRoot();
      if (!token) {
        toast({ title: 'Not authenticated', description: 'Please sign in to create a post.' });
        return;
      }
      let payload: any;
      if (user?.role === 'STUDENT') {
        payload = {
          type: 'STUDENT_REQUEST',
          title: `Looking for a Teacher — ${subject}`,
          subject,
          grade: level === 'GRADE' ? `Grade ${grade}` : grade,
          description,
          mode: 'ONLINE',
          // store preferred times and budget inside syllabus JSON for student requests
          syllabus: JSON.stringify({ preferredTimes, budgetMin, budgetMax }),
        };
      } else {
        // Teacher offering
        payload = {
          type: 'TEACHER_OFFERING',
          title: `${subject} Class`,
          description,
          subject,
          grade: level === 'GRADE' ? `Grade ${grade}` : grade,
          mode: 'ONLINE',
          fee: pricePerClass != null ? Number(pricePerClass) : null,
          // store availability and price inside syllabus JSON for now
          syllabus: JSON.stringify({ availability: preferredTimes, pricePerClass }),
        };
      }
      let res: Response;
      try {
        res = await fetch(`${apiRoot}/posts${editId ? `/${editId}` : ''}`, {
          method: editId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      } catch (fetchErr) {
        console.error('Network/fetch error when creating post', fetchErr);
        throw new Error('Network error: could not reach API. Is the backend running?');
      }
      if (!res.ok) {
        // try parse error body
        let msg = 'Failed to create post';
        try {
          const j = await res.json();
          msg = (j && (j.message || j.error || j.msg)) || msg;
        } catch (e) {
          try { msg = await res.text(); } catch (e) { /* ignore */ }
        }
        throw new Error(msg || `HTTP ${res.status}`);
      }
      toast({ title: 'Post created', description: 'Your post is live.' });
      navigate('/feed');
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message || 'Failed' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardLayout>
        <main className="container mx-auto p-8">
          <div className="max-w-2xl mx-auto bg-card p-6 rounded-xl">
          <h2 className="text-2xl font-semibold mb-4">Create Post</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Post</label>
              <div className="mt-2">
                {user?.role === 'STUDENT' ? (
                  <div className="px-3 py-2 rounded-md bg-muted/10 inline-block">Looking for a Teacher</div>
                ) : (
                  <div className="flex gap-2">
                    <button type="button" className={`px-3 py-1 rounded-lg ${type === 'TEACHER_OFFERING' ? 'bg-card' : 'text-muted-foreground'}`} onClick={() => setType('TEACHER_OFFERING')}>Offering (Teacher)</button>
                    <button type="button" className={`px-3 py-1 rounded-lg ${type === 'STUDENT_REQUEST' ? 'bg-card' : 'text-muted-foreground'}`} onClick={() => setType('STUDENT_REQUEST')}>Request (Student)</button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Subject</label>
              <select className="w-full p-2 rounded-md border" value={subject} onChange={(e)=> setSubject(e.target.value)} required>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Level</label>
                <select className="w-full p-2 rounded-md border" value={level} onChange={(e)=> setLevel(e.target.value as any)}>
                  <option value="GRADE">Grade 1-13</option>
                  <option value="OL">O/L</option>
                  <option value="AL">A/L</option>
                  <option value="UNIVERSITY">University</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Grade</label>
                {level === 'GRADE' ? (
                  <select className="w-full p-2 rounded-md border" value={grade} onChange={(e)=> setGrade(e.target.value)}>
                    {gradeOptions.map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                ) : (
                  <Input value={grade} onChange={(e)=> setGrade(e.target.value)} placeholder={level === 'OL' ? 'O/L' : level === 'AL' ? 'A/L' : 'University level'} />
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            {user?.role === 'TEACHER' ? (
              <>
                <div>
                  <label className="text-sm font-medium">Price per class (USD)</label>
                  <Input type="number" value={pricePerClass ?? ''} onChange={(e) => setPricePerClass(e.target.value ? Number(e.target.value) : null)} />
                </div>

                <div className="mt-3">
                  <label className="text-sm font-medium">Teaching mode</label>
                  <div className="mt-2 text-sm text-muted-foreground">Online only</div>
                </div>

                <div className="mt-3">
                  <label className="text-sm font-medium">Availability (select all that apply)</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {availabilityOptions.map(opt => (
                      <label key={opt} className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={preferredTimes.includes(opt)} onChange={(e) => {
                          if (e.target.checked) setPreferredTimes(prev => [...prev, opt]);
                          else setPreferredTimes(prev => prev.filter(a=>a!==opt));
                        }} />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              // Student-only fields
              <>
                <div>
                  <label className="text-sm font-medium">Preferred days / times</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {availabilityOptions.map(opt => (
                      <label key={opt} className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={preferredTimes.includes(opt)} onChange={(e) => {
                          if (e.target.checked) setPreferredTimes(prev => [...prev, opt]);
                          else setPreferredTimes(prev => prev.filter(a=>a!==opt));
                        }} />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Min budget (USD)</label>
                    <Input type="number" value={budgetMin ?? ''} onChange={(e) => setBudgetMin(e.target.value ? Number(e.target.value) : null)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max budget (USD)</label>
                    <Input type="number" value={budgetMax ?? ''} onChange={(e) => setBudgetMax(e.target.value ? Number(e.target.value) : null)} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-sm font-medium">Teaching mode</label>
                  <div className="mt-2 text-sm text-muted-foreground">Online only</div>
                </div>
              </>
            )}

            <div className="flex items-center justify-end">
              <Button type="submit">Create Post</Button>
            </div>
          </form>
          </div>
        </main>
      </DashboardLayout>
      <Footer />
    </div>
  );
};

export default CreatePost;
