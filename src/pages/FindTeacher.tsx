'use client';
import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/layout/Footer";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, DollarSign, Star, Filter, LayoutGrid, LayoutList, MessageCircle, Heart, Share2 } from "lucide-react";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  subjects?: string[];
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

  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  const [showFilters, setShowFilters] = useState(false);
  const [viewType, setViewType] = useState<'grid' | 'compact'>('grid');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/teachers`);
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
        const hay = `${t.firstName} ${t.lastName} ${(t.subjects || []).join(' ')} `.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (subject && !(t.subjects || []).includes(subject)) return false;

      if (minPrice != null && (t.startingPrice == null || t.startingPrice < minPrice)) return false;
      if (maxPrice != null && (t.startingPrice == null || t.startingPrice > maxPrice)) return false;
      if (minRating != null && (t.rating == null || t.rating < minRating)) return false;
      return true;
    });
  }, [teachers, query, subject, minPrice, maxPrice, minRating, verifiedOnly]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardLayout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center mb-6">
            <h1 className="text-3xl font-bold">Find Teachers</h1>
            <p className="text-muted-foreground">Browse verified teachers, compare prices and book classes.</p>
          </div>

          <div className={`${viewType === 'grid' ? 'max-w-6xl' : 'max-w-4xl'} mx - auto mb - 6`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex gap-3 flex-1 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or subject..." className="pl-12 h-12" />
                </div>
                <Button variant="outline" onClick={() => setShowFilters(s => !s)} className="gap-2 h-12"><Filter className="w-4 h-4" />Filters</Button>
              </div>

              <div className="flex bg-muted rounded-xl p-1 shrink-0">
                <button
                  onClick={() => setViewType('grid')}
                  className={`p - 2 rounded - lg transition - all ${viewType === 'grid' ? 'bg-card shadow-soft text-primary' : 'text-muted-foreground'} `}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewType('compact')}
                  className={`p - 2 rounded - lg transition - all ${viewType === 'compact' ? 'bg-card shadow-soft text-primary' : 'text-muted-foreground'} `}
                  title="Compact View"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 bg-card rounded-xl p-4 border border-border">
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input placeholder="Subject (e.g. Mathematics)" value={subject ?? ''} onChange={(e) => setSubject(e.target.value || null)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Grade / Level</label>
                    <Input placeholder="e.g. Grade 10, Undergraduate" value={grade ?? ''} onChange={(e) => setGrade(e.target.value || null)} />
                  </div>
                  <div />
                </div>

                <div className="grid md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="text-sm font-medium">Min price</label>
                    <Input type="number" placeholder="Min" value={minPrice ?? ''} onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : null)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max price</label>
                    <Input type="number" placeholder="Max" value={maxPrice ?? ''} onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Min rating</label>
                    <Input type="number" placeholder="e.g. 4" value={minRating ?? ''} onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : null)} />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3 mt-3">
                  <div />
                  <div />
                  <div className="flex items-end justify-end">
                    <Button variant="outline" onClick={() => { setSubject(null); setGrade(null); setMinPrice(null); setMaxPrice(null); setMinRating(null); setVerifiedOnly(true); }}>Reset Filters</Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} /> Verified only</label>
                </div>
              </div>
            )}
          </div>

          <div className={`${viewType === 'grid' ? 'max-w-6xl' : 'max-w-4xl'} mx - auto`}>
            <div className={viewType === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {isLoading && <div className="text-center text-muted-foreground w-full py-10">Loading teachers...</div>}
              {!isLoading && filtered.length === 0 && (
                <div className="text-center text-muted-foreground w-full py-10">No teachers found matching your criteria.</div>
              )}
              {filtered.map((t) => {
                const isExpanded = expandedId === t.id;

                if (viewType === 'compact') {
                  return (
                    <div key={t.id} className="space-y-2">
                      <article className={`bg - card rounded - xl p - 4 shadow - sm border border - border / 50 hover: border - primary / 30 transition - all flex items - center justify - between gap - 4 ${isExpanded ? 'border-primary/50 ring-1 ring-primary/5' : ''} `}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w - 10 h - 10 shrink - 0 rounded - lg gradient - hero flex items - center justify - center text - sm font - semibold text - primary - foreground`}>{(t.firstName || '').charAt(0)}{(t.lastName || '').charAt(0)}</div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{t.firstName} {t.lastName}</h3>
                            <p className="text-xs text-muted-foreground truncate">{(t.subjects || []).join(', ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {t.startingPrice && <span className="text-sm font-bold text-primary">${t.startingPrice}</span>}
                          <Button
                            variant={isExpanded ? "secondary" : "ghost"}
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => setExpandedId(isExpanded ? null : t.id)}
                          >
                            {isExpanded ? 'Close' : 'View'}
                          </Button>
                        </div>
                      </article>

                      {isExpanded && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="bg-card p-6 rounded-2xl shadow-elevated border border-primary/20">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center text-primary-foreground font-bold text-xl">{(t.firstName || '').charAt(0)}{(t.lastName || '').charAt(0)}</div>
                                <div>
                                  <Link href={`/ teachers / ${t.id} `} className="font-bold text-xl hover:text-primary transition-colors">{t.firstName} {t.lastName}</Link>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={t.verified ? 'secondary' : 'outline'} className="text-[10px] h-5">{t.verified ? 'Verified' : 'Pending'}</Badge>
                                    <div className="flex items-center text-yellow-500 text-sm font-bold"><Star className="w-3.5 h-3.5 fill-current mr-1" /> {t.rating ?? 'New'}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-primary">${t.startingPrice}<span className="text-xs text-muted-foreground font-normal">/hr</span></div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Online Classes</div>
                              </div>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">{t.bio || 'No bio available yet.'}</p>
                            <div className="flex flex-wrap gap-2 mb-6">
                              {(t.subjects || []).map(s => <Badge key={s} variant="outline" className="bg-muted/50 border-none font-medium">{s}</Badge>)}
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-border">
                              <Button className="flex-1 gradient-hero shadow-soft h-11" onClick={() => router.push(`/teachers/${t.id}`)}>Book a Class</Button>
                              <Button variant="outline" className="h-11 px-5" onClick={() => router.push(`/teachers/${t.id}`)}><MessageCircle className="w-5 h-5" /></Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={t.id} className="bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 border border-border/50 flex flex-col h-full">
                    <div className="flex items-start gap-4 mb-4 flex-1">
                      <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center text-primary-foreground font-bold text-2xl shrink-0">{(t.firstName || '').charAt(0)}{(t.lastName || '').charAt(0)}</div>
                      <div className="min-w-0">
                        <Link href={`/ teachers / ${t.id} `} className="font-bold text-xl hover:text-primary transition-colors block truncate">{t.firstName} {t.lastName}</Link>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(t.subjects || []).slice(0, 3).map(s => <span key={s} className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{s}</span>)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-auto pt-4 border-t border-border justify-between w-full">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center text-yellow-500 font-bold"><Star className="w-4 h-4 fill-current mr-1" /> {t.rating ?? 'New'}</div>
                          <div className="text-[10px] text-muted-foreground uppercase font-medium">Rating</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-foreground">${t.startingPrice ?? '—'}</div>
                          <div className="text-[10px] text-muted-foreground uppercase font-medium">Starting</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={t.verified ? 'secondary' : 'outline'} className="hidden sm:inline-flex">{t.verified ? 'Verified' : 'Pending'}</Badge>
                        <Button className={`${viewType === 'grid' ? 'flex-1' : ''} `} onClick={() => { if (!isAuthenticated) { toast({ title: 'Sign in to contact' }); router.push('/auth'); return; } router.push(`/teachers/${t.id}`); }}>View Profile</Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </DashboardLayout>
      <Footer />
    </div>
  );
};

export default FindTeacher;
