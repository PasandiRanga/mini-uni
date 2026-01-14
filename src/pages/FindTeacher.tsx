import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Search, MapPin, DollarSign, Star, Filter } from "lucide-react";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  subjects?: string[];
  city?: string;
  rating?: number;
  startingPrice?: number;
  verified?: boolean;
  bio?: string;
};

const FindTeacher: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<string | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [mode, setMode] = useState<'ANY' | 'ONLINE' | 'PHYSICAL'>('ANY');
  const [showFilters, setShowFilters] = useState(false);

  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/teachers`);
        if (!res.ok) {
          console.error('Teachers fetch failed', res.status, res.statusText);
          return;
        }

        const json = await res.json();
        let rawList: any[] = [];
        if (Array.isArray(json)) rawList = json;
        else if (json && Array.isArray((json as any).data)) rawList = (json as any).data;
        else if (json && Array.isArray((json as any).items)) rawList = (json as any).items;
        else if (json && typeof json === 'object') rawList = [json];

        // Normalize to our Teacher shape, extracting verificationStatus / hourlyRate from teacherProfile when present
        const list: Teacher[] = rawList.map((r: any) => ({
          id: r.id,
          firstName: r.firstName || r.user?.firstName || '',
          lastName: r.lastName || r.user?.lastName || '',
          subjects: r.teacherProfile?.subjects || r.subjects || [],
          city: r.city || r.teacherProfile?.city || undefined,
          rating: r.rating || r.teacherProfile?.rating || undefined,
          startingPrice: r.teacherProfile?.hourlyRate || r.startingPrice || undefined,
          verified: (r.verified === true) || (r.teacherProfile && r.teacherProfile.verificationStatus === 'APPROVED') || false,
          bio: r.teacherProfile?.bio || r.bio || undefined,
        }));

        setTeachers(list || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      if (verifiedOnly && !t.verified) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${t.firstName} ${t.lastName} ${(t.subjects || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (subject && !(t.subjects || []).includes(subject)) return false;
      if (city && t.city && !t.city.toLowerCase().includes(city.toLowerCase())) return false;
      if (minPrice != null && (t.startingPrice == null || t.startingPrice < minPrice)) return false;
      if (maxPrice != null && (t.startingPrice == null || t.startingPrice > maxPrice)) return false;
      if (minRating != null && (t.rating == null || t.rating < minRating)) return false;
      return true;
    });
  }, [teachers, query, subject, city, minPrice, maxPrice, minRating, verifiedOnly]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center mb-6">
          <h1 className="text-3xl font-bold">Find Teachers</h1>
          <p className="text-muted-foreground">Browse verified teachers, compare prices and book classes.</p>
        </div>

        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or subject..." className="pl-12 h-12" />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(s => !s)} className="gap-2"><Filter className="w-4 h-4"/>Filters</Button>
          </div>

          {showFilters && (
            <div className="mt-4 bg-card rounded-xl p-4 border border-border">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input placeholder="Subject (e.g. Mathematics)" value={subject ?? ''} onChange={(e)=> setSubject(e.target.value || null)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Grade / Level</label>
                  <Input placeholder="e.g. Grade 10, Undergraduate" value={grade ?? ''} onChange={(e)=> setGrade(e.target.value || null)} />
                </div>
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input placeholder="City or area" value={city ?? ''} onChange={(e)=> setCity(e.target.value || null)} />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="text-sm font-medium">Min price</label>
                  <Input type="number" placeholder="Min" value={minPrice ?? ''} onChange={(e)=> setMinPrice(e.target.value ? Number(e.target.value) : null)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Max price</label>
                  <Input type="number" placeholder="Max" value={maxPrice ?? ''} onChange={(e)=> setMaxPrice(e.target.value ? Number(e.target.value) : null)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Min rating</label>
                  <Input type="number" placeholder="e.g. 4" value={minRating ?? ''} onChange={(e)=> setMinRating(e.target.value ? Number(e.target.value) : null)} />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="text-sm font-medium">Mode</label>
                  <div className="flex gap-2 mt-1">
                    <button className={`px-3 py-1 rounded-lg ${mode === 'ANY' ? 'bg-card' : 'text-muted-foreground'}`} onClick={() => setMode('ANY')}>Any</button>
                    <button className={`px-3 py-1 rounded-lg ${mode === 'ONLINE' ? 'bg-card' : 'text-muted-foreground'}`} onClick={() => setMode('ONLINE')}>Online</button>
                    <button className={`px-3 py-1 rounded-lg ${mode === 'PHYSICAL' ? 'bg-card' : 'text-muted-foreground'}`} onClick={() => setMode('PHYSICAL')}>Physical</button>
                  </div>
                </div>
                <div />
                <div className="flex items-end justify-end">
                  <Button variant="outline" onClick={() => { setSubject(null); setGrade(null); setCity(null); setMinPrice(null); setMaxPrice(null); setMinRating(null); setVerifiedOnly(true); }}>Reset Filters</Button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3">
                <label className="flex items-center gap-2"><input type="checkbox" checked={verifiedOnly} onChange={(e)=> setVerifiedOnly(e.target.checked)} /> Verified only</label>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid gap-4">
            {isLoading && <div className="text-center text-muted-foreground">Loading...</div>}
              {!isLoading && filtered.length === 0 && teachers.length === 0 && (
                <div className="text-center text-muted-foreground">No teachers found.</div>
              )}
              {!isLoading && filtered.length === 0 && teachers.length > 0 && (
                <div className="text-center text-muted-foreground">No teachers match your filters. Try toggling "Verified only" or clearing other filters.</div>
              )}
            {filtered.map((t) => (
              <div key={t.id} className="bg-card p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground font-semibold">{(t.firstName||'').charAt(0)}{(t.lastName||'').charAt(0)}</div>
                    <div>
                      <Link to={`/teachers/${t.id}`} className="font-semibold text-lg">{t.firstName} {t.lastName}</Link>
                      <div className="text-sm text-muted-foreground">{(t.subjects||[]).slice(0,3).join(', ')}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4"/> {t.city || '—'}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2"><Star className="w-4 h-4"/> {t.rating ?? '—'}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="w-4 h-4"/> ${t.startingPrice ?? '—'}</div>
                  <Badge variant={t.verified ? 'secondary' : 'outline'}>{t.verified ? 'Verified' : 'Unverified'}</Badge>
                  <Button onClick={() => { if (!isAuthenticated) { toast({ title: 'Sign in to contact', description: 'Please sign in to message or book.'}); navigate('/auth'); return; } navigate(`/teachers/${t.id}`); }}>View</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FindTeacher;
