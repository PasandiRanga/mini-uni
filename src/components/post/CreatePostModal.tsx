'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import SlotPickerCalendar, { type PickerSlot } from '@/components/calendar/SlotPickerCalendar';
import { formatMoney } from '@/lib/currency';
import { ImagePlus, Users, User, Clock, Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useTeacherStatus } from '@/hooks/useTeacherStatus';
import { compressImage } from '@/lib/imageCompress';
import { SuggestInput } from '@/components/ui/suggest-input';
import { AL, AL_STREAMS, LEVEL_GROUPS, joinGrade, splitGrade, subjectsFor } from '@/lib/classLevels';

const CLASS_TYPES = [
  { id: 'INDIVIDUAL', label: 'Individual', icon: User, hint: 'One-on-one' },
  { id: 'GROUP', label: 'Group', icon: Users, hint: 'Capped group' },
] as const;

// Red asterisk that marks a required field.
const Req = () => <span className="text-destructive"> *</span>;

export interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string | null;
  /** Already-loaded post to prefill from instantly (avoids a fetch round-trip). */
  initialPost?: any;
  /** Called with the saved post so lists can update optimistically. */
  onSuccess?: (post: any, action: 'created' | 'updated') => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ open, onOpenChange, editId, initialPost, onSuccess }) => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const isTeacher = user?.role === 'TEACHER';
  // Teachers can only post once an admin has approved their profile.
  const teacherStatus = useTeacherStatus();
  const { refresh: refreshTeacherStatus } = teacherStatus;
  useEffect(() => {
    if (open && isTeacher) refreshTeacherStatus();
  }, [open, isTeacher, refreshTeacherStatus]);
  const awaitingApproval = isTeacher && !teacherStatus.isApproved;
  const currency = user?.currency;

  // shared
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  // teacher offering
  const [title, setTitle] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [classTypes, setClassTypes] = useState<string[]>(['INDIVIDUAL']);
  const [maxStudents, setMaxStudents] = useState<number | ''>('');
  const [ratePerHour, setRatePerHour] = useState<number | ''>('');
  const [groupRatePerHour, setGroupRatePerHour] = useState<number | ''>('');
  const [durationMin, setDurationMin] = useState<number>(60);
  const [slots, setSlots] = useState<PickerSlot[]>([]);
  const [busy, setBusy] = useState<{ start: string; end: string; title?: string }[]>([]);

  // grade/level — required for a student request, optional on a teacher offering
  const [grade, setGrade] = useState('');
  // A/L only: the stream narrows the subject list and is saved as "A/L · <stream>".
  const [stream, setStream] = useState('');
  const [budget, setBudget] = useState<number | ''>('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !isAuthenticated || !isTeacher) return;
    fetch('/api/teachers/occupied-slots')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => Array.isArray(d) && setBusy(d))
      .catch(() => {});
  }, [open, isAuthenticated, isTeacher]);

  // When duration changes, resize already-selected slots to keep start, end = start + duration.
  const applyDuration = (min: number) => {
    setDurationMin(min);
    setSlots((prev) => prev.map((s) => ({ start: s.start, end: new Date(s.start.getTime() + min * 60000) })));
  };

  const toggleType = (id: string) =>
    setClassTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const onThumb = async (file?: File) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png'];
    const okByExt = /\.(jpe?g|png)$/i.test(file.name);
    if (!allowed.includes(file.type) && !okByExt) {
      toast({ title: 'Unsupported file', description: 'Use a JPG, JPEG or PNG image.', variant: 'destructive' });
      return;
    }
    try {
      // Shrink before upload: a full-size phone photo exceeds the 4.5 MB request limit (HTTP 413).
      setThumbnail(await compressImage(file, { maxDimension: 1600 }));
    } catch {
      toast({ title: "Couldn't read that image", description: 'Try a different JPG or PNG.', variant: 'destructive' });
    }
  };

  const isAL = grade === AL;
  const subjectOptions = subjectsFor(grade, stream);
  // A subject picked for another level/stream is cleared, typed-in ones are kept.
  const changeLevel = (next: string) => {
    if (next === grade) return;
    if (subject && subjectsFor(grade, stream).includes(subject) && !subjectsFor(next).includes(subject)) setSubject('');
    setGrade(next);
    setStream('');
  };
  const changeStream = (next: string) => {
    if (subject && subjectsFor(AL, stream).includes(subject) && !subjectsFor(AL, next).includes(subject)) setSubject('');
    setStream(next);
  };
  const fullGrade = joinGrade(grade, stream);

  const pricePerClass = ratePerHour !== '' ? Number(ratePerHour) * (durationMin / 60) : 0;

  // All required fields must be filled before the post can be submitted.
  const groupSelected = classTypes.includes('GROUP');
  // Offering both lets students choose, so group seats get their own per-student
  // rate. A group-only post just uses the main rate.
  const needsGroupRate = groupSelected && classTypes.includes('INDIVIDUAL');
  const groupPricePerClass = needsGroupRate && groupRatePerHour !== '' ? Number(groupRatePerHour) * (durationMin / 60) : null;
  const groupRateOk = !needsGroupRate || (groupRatePerHour !== '' && Number(groupRatePerHour) > 0);
  const streamOk = !isAL || stream !== '';
  const canSubmit = !streamOk ? false : isTeacher
    ? subject.trim() !== '' && description.trim() !== '' && classTypes.length > 0 && ratePerHour !== '' && Number(ratePerHour) > 0 && groupRateOk && slots.length > 0 && (!groupSelected || (maxStudents !== '' && Number(maxStudents) >= 2))
    : subject.trim() !== '' && description.trim() !== '' && grade.trim() !== '';

  // Clear every field back to its default.
  const resetForm = () => {
    setSubject('');
    setDescription('');
    setTitle('');
    setThumbnail(null);
    setClassTypes(['INDIVIDUAL']);
    setMaxStudents('');
    setRatePerHour('');
    setGroupRatePerHour('');
    setDurationMin(60);
    setSlots([]);
    setGrade('');
    setStream('');
    setBudget('');
  };

  // Cancel: wipe the form and close.
  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  // Copy an existing post's values into the form fields.
  const fillFromPost = (p: any) => {
    setSubject(p.subject || '');
    setDescription(p.description || '');
    setTitle(p.title || '');
    setThumbnail(p.thumbnailUrl || null);
    setClassTypes(Array.isArray(p.classTypes) && p.classTypes.length ? p.classTypes : ['INDIVIDUAL']);
    setMaxStudents(p.maxStudents != null ? Number(p.maxStudents) : '');
    setRatePerHour(p.ratePerHour != null ? Number(p.ratePerHour) : '');
    setGroupRatePerHour(p.groupRatePerHour != null ? Number(p.groupRatePerHour) : '');
    const sl: PickerSlot[] = (p.timeSlots || []).map((t: { startTime: string; endTime: string }) => ({ start: new Date(t.startTime), end: new Date(t.endTime) }));
    setSlots(sl);
    if (sl.length) setDurationMin(Math.max(15, Math.round((sl[0].end.getTime() - sl[0].start.getTime()) / 60000)));
    const g = splitGrade(p.grade);
    setGrade(g.level);
    setStream(g.stream);
    let budgetVal: number | '' = '';
    if (p.syllabus) { try { const s = JSON.parse(p.syllabus); if (s && s.budget != null && s.budget !== '') budgetVal = Number(s.budget); } catch { /* not JSON */ } }
    setBudget(budgetVal);
  };

  // Prefill the form when editing an existing post; start blank when creating.
  useEffect(() => {
    if (!open) return;
    if (!editId) { resetForm(); return; }
    // Prefill instantly from the post the caller already has (no blank flash).
    if (initialPost) { fillFromPost(initialPost); return; }
    // Fallback: fetch by id (e.g. when opened from a deep link without the object).
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/posts/${editId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const p = await res.json();
        if (!cancelled) fillFromPost(p);
      } catch {
        if (!cancelled) toast({ title: 'Could not load post', description: 'Please try again.', variant: 'destructive' });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editId, initialPost]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTeacher) {
      if (classTypes.length === 0) { toast({ title: 'Pick a class type', variant: 'destructive' }); return; }
      if (slots.length === 0) { toast({ title: 'Add at least one time slot', variant: 'destructive' }); return; }
      if (ratePerHour === '' || Number(ratePerHour) <= 0) { toast({ title: 'Enter an hourly rate', variant: 'destructive' }); return; }
      if (classTypes.includes('GROUP') && (maxStudents === '' || Number(maxStudents) < 2)) { toast({ title: 'Set max students for the group', variant: 'destructive' }); return; }
      if (!groupRateOk) { toast({ title: 'Enter a group rate per student', variant: 'destructive' }); return; }
    }
    setSubmitting(true);
    try {
      const payload: any = isTeacher
        ? {
            type: 'TEACHER_OFFERING',
            title: title.trim() || `${subject} Class`,
            subject,
            grade: fullGrade || null,
            description,
            classTypes,
            maxStudents: classTypes.includes('GROUP') && maxStudents !== '' ? Number(maxStudents) : null,
            ratePerHour: Number(ratePerHour),
            durationMin,
            fee: Number(pricePerClass.toFixed(2)),
            groupRatePerHour: needsGroupRate ? Number(groupRatePerHour) : null,
            groupFee: groupPricePerClass != null ? Number(groupPricePerClass.toFixed(2)) : null,
            thumbnailUrl: thumbnail,
            availabilitySlots: slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() })),
          }
        : {
            type: 'STUDENT_REQUEST',
            title: `Looking for a Teacher — ${subject}`,
            subject,
            grade: fullGrade,
            description,
            syllabus: JSON.stringify({ budget }),
          };

      const res = await fetch(`/api/posts${editId ? `/${editId}` : ''}`, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (res.status === 413) throw new Error('That image is too large. Try a smaller one.');
        throw new Error(j.error || j.message || `HTTP ${res.status}`);
      }
      const saved = await res.json().catch(() => ({}));

      // Build the full post object so lists can update instantly (no refetch).
      const optimisticPost = {
        id: editId || saved?.id || `tmp-${Date.now()}`,
        userId: user?.id,
        type: payload.type,
        title: payload.title,
        subject,
        grade: fullGrade || (isTeacher ? null : ''),
        description,
        fee: isTeacher ? Number(pricePerClass.toFixed(2)) : null,
        ratePerHour: isTeacher && ratePerHour !== '' ? Number(ratePerHour) : null,
        groupRatePerHour: isTeacher && needsGroupRate ? Number(groupRatePerHour) : null,
        groupFee: isTeacher && groupPricePerClass != null ? Number(groupPricePerClass.toFixed(2)) : null,
        currency,
        classTypes: isTeacher ? classTypes : [],
        maxStudents: isTeacher && classTypes.includes('GROUP') && maxStudents !== '' ? Number(maxStudents) : null,
        thumbnailUrl: isTeacher ? thumbnail : null,
        syllabus: isTeacher ? null : JSON.stringify({ budget }),
        isActive: true,
        createdAt: initialPost?.createdAt || saved?.createdAt || new Date().toISOString(),
        timeSlots: isTeacher ? slots.map((s) => ({ startTime: s.start.toISOString(), endTime: s.end.toISOString() })) : [],
        user: user ? { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role } : undefined,
      };

      toast({ title: editId ? 'Post updated' : 'Post published', description: 'Your post is now live in Explore.' });
      onSuccess?.(optimisticPost, editId ? 'updated' : 'created');
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {!isAuthenticated ? (
          <div className="p-8 text-center">Please sign in to create a post.</div>
        ) : awaitingApproval ? (
          teacherStatus.loading && !teacherStatus.status ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-5 p-8 text-center sm:p-10">
              <DialogHeader className="items-center space-y-3 text-center sm:text-center">
                <span className={`flex h-12 w-12 items-center justify-center rounded-full ${teacherStatus.status === 'REJECTED' || teacherStatus.status === 'SUSPENDED' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                  {teacherStatus.status === 'REJECTED' || teacherStatus.status === 'SUSPENDED' ? <ShieldAlert className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                </span>
                <DialogTitle className="text-2xl font-semibold">
                  {teacherStatus.status === 'SUSPENDED'
                    ? 'Your teaching account is suspended'
                    : teacherStatus.status === 'REJECTED'
                      ? 'Your profile needs changes'
                      : 'Your profile is pending approval'}
                </DialogTitle>
                <DialogDescription className="mx-auto max-w-md text-sm text-muted-foreground">
                  {teacherStatus.status === 'SUSPENDED'
                    ? `You can't post classes while suspended.${teacherStatus.suspensionReason ? ` Reason: ${teacherStatus.suspensionReason}` : ''} Contact support if you have questions.`
                    : teacherStatus.status === 'REJECTED'
                    ? teacherStatus.rejectionReason
                      ? `Our team asked for changes: ${teacherStatus.rejectionReason} Update your profile and it'll be reviewed again.`
                      : "Our team asked for changes to your profile. Update it and it'll be reviewed again."
                    : teacherStatus.percent < 100
                      ? `Finish your profile (${teacherStatus.percent}% done) so our team can review it. You can post classes once you're approved.`
                      : "Our team is reviewing your details. You'll be able to post classes as soon as you're approved — we'll email you."}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                {(teacherStatus.status === 'REJECTED' || teacherStatus.percent < 100) && (
                  <Button variant="hero" asChild onClick={() => onOpenChange(false)}>
                    <Link href="/teacher/profile-completion">Complete profile</Link>
                  </Button>
                )}
              </div>
            </div>
          )
        ) : (
          <>
            <DialogHeader className="border-b border-border/60 px-6 py-5 sm:px-8">
              <DialogTitle className="text-2xl font-normal sm:text-3xl">
                {isTeacher ? <>Create a <span className="font-serif text-gradient font-semibold">class</span></> : <>Request a <span className="font-serif text-gradient font-semibold">teacher</span></>}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {isTeacher ? 'Tell students what you teach and when you’re available.' : 'Describe what you want to learn.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-6 px-6 py-6 sm:px-8">
              {/* Title (teacher) */}
              {isTeacher && (
                <div className="space-y-1.5">
                  <Label htmlFor="title">Class title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. A/L Physics - Mechanics intensive" />
                </div>
              )}

              {/* Level first: it decides which subjects are suggested. */}
              <div className="space-y-1.5">
                <Label htmlFor="grade">Level / grade{!isTeacher && <Req />}</Label>
                <SuggestInput
                  id="grade"
                  value={grade}
                  onChange={changeLevel}
                  groups={LEVEL_GROUPS}
                  placeholder="Select a grade or level"
                  searchPlaceholder="Search or type a level…"
                />
              </div>

              {isAL && (
                <div className="space-y-2">
                  <Label>Stream<Req /></Label>
                  <div className="flex flex-wrap gap-2">
                    {AL_STREAMS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => changeStream(s)}
                        aria-pressed={stream === s}
                        className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${stream === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70 hover:bg-muted/60'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject<Req /></Label>
                <SuggestInput
                  id="subject"
                  value={subject}
                  onChange={setSubject}
                  options={subjectOptions}
                  placeholder={grade ? 'Select a subject' : 'Select or type a subject'}
                  searchPlaceholder="Search or type a subject…"
                />
                {isAL && !stream && <p className="text-xs text-muted-foreground">Pick a stream to see its subjects.</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="desc">Description<Req /></Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will you cover?"
                  required
                  className="min-h-[120px] rounded-xl border-input bg-card px-4 py-3 text-base shadow-soft transition-all duration-200 placeholder:text-muted-foreground/70 hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 focus-visible:border-ring md:text-sm"
                />
              </div>

              {isTeacher ? (
                <>
                  {/* Thumbnail */}
                  <div className="space-y-1.5">
                    <Label>Thumbnail / post image <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    {thumbnail ? (
                      <div className="relative w-full overflow-hidden rounded-xl border border-input bg-card shadow-soft">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumbnail} alt="thumbnail" className="h-50 w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/25">
                          <label className="cursor-pointer rounded-full border border-white/80 bg-transparent px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/15">
                            Update
                            <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="hidden" onChange={(e) => onThumb(e.target.files?.[0])} />
                          </label>
                          <button type="button" onClick={() => setThumbnail(null)} className="rounded-full border border-white/80 bg-transparent px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/15">
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-input bg-card text-muted-foreground shadow-soft transition-all duration-200 hover:border-foreground/25">
                        <ImagePlus className="h-6 w-6" strokeWidth={1.75} />
                        <span className="text-sm">Click to upload (JPG, JPEG or PNG)</span>
                        <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="hidden" onChange={(e) => onThumb(e.target.files?.[0])} />
                      </label>
                    )}
                  </div>

                  {/* Class types (multi-select) */}
                  <div className="space-y-2">
                    <Label>Class type<Req /> <span className="font-normal text-muted-foreground">(select all you offer)</span></Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {CLASS_TYPES.map((ct) => {
                        const active = classTypes.includes(ct.id);
                        return (
                          <button type="button" key={ct.id} onClick={() => toggleType(ct.id) }
                            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${active ? 'border-primary bg-primary/[0.06]' : 'border-border/70 hover:bg-muted/50'}`}>
                            <ct.icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.75} />
                            <div>
                              <p className="text-sm font-medium">{ct.label}</p>
                              <p className="text-xs text-muted-foreground">{ct.hint}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {groupSelected && (
                      <div className="space-y-1.5 pt-2">
                        <Label htmlFor="maxStudents">Max students (group)<Req /></Label>
                        <Input id="maxStudents" type="number" required min={2} value={maxStudents} onChange={(e) => setMaxStudents(e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 10" className="max-w-[180px]" />
                      </div>
                    )}
                    {needsGroupRate && (
                      <div className="space-y-1.5 pt-2">
                        <Label htmlFor="groupRate">Group rate per hour, per student<Req /></Label>
                        <div className="flex flex-wrap items-center gap-3">
                          <Input id="groupRate" type="number" required min={0} value={groupRatePerHour} onChange={(e) => setGroupRatePerHour(e.target.value ? Number(e.target.value) : '')} placeholder="0.00" className="max-w-[180px]" />
                          {groupPricePerClass != null && (
                            <span className="text-sm text-muted-foreground">{formatMoney(groupPricePerClass, currency)} per student, per class</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rate + duration + computed price */}
                  <div className="grid gap-5 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="rate">{needsGroupRate ? 'Individual rate per hour' : 'Rate per hour'}<Req /></Label>
                      <Input id="rate" type="number" min={0} value={ratePerHour} onChange={(e) => setRatePerHour(e.target.value ? Number(e.target.value) : '')} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="durationHr">Duration</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <Input
                            id="durationHr"
                            type="number"
                            min={0}
                            value={Math.floor(durationMin / 60)}
                            onChange={(e) => applyDuration(Math.max(15, Math.max(0, Number(e.target.value) || 0) * 60 + (durationMin % 60)))}
                            className="pr-9"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">hr</span>
                        </div>
                        <div className="relative">
                          <Input
                            id="durationMin"
                            aria-label="Duration minutes"
                            type="number"
                            min={0}
                            max={59}
                            value={durationMin % 60}
                            onChange={(e) => {
                              const m = Math.min(59, Math.max(0, Number(e.target.value) || 0));
                              applyDuration(Math.max(15, Math.floor(durationMin / 60) * 60 + m));
                            }}
                            className="pr-9"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">min</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Price / class</Label>
                      <div className="flex h-11 items-center rounded-xl border border-input bg-card px-4 text-base font-medium shadow-soft md:text-sm">
                        {formatMoney(pricePerClass, currency)}
                      </div>
                    </div>
                  </div>

                  {/* Availability calendar */}
                  <div className="space-y-2">
                    <Label>Availability<Req /></Label>
                    {/* <p className="text-xs text-muted-foreground">
                      Click a time to set your {durationMin}-min slot, or drag to set a custom length. Picking again moves the slot. Booked times are disabled. {slots.length === 1 ? 'Slot selected.' : 'No slot selected.'}
                    </p> */}
                    <SlotPickerCalendar
                      single
                      selected={slots}
                      onChange={setSlots}
                      busy={busy}
                      durationMin={durationMin}
                      onDurationChange={(m) => setDurationMin(m)}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="budget">Budget per class</Label>
                  <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : '')} className="max-w-[200px]" />
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
                <Button type="submit" variant="hero" disabled={submitting || !canSubmit}>
                  {submitting ? (editId ? 'Saving…' : 'Publishing…') : editId ? 'Save changes' : 'Create and publish'}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
