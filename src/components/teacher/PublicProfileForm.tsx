'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ProfileLoadError from "@/components/teacher/ProfileLoadError";
import { POPULAR_SUBJECTS } from "@/lib/classLevels";
import { Check, Loader2, Plus, X } from "lucide-react";

const BIO_MAX = 1000;
const SUBJECT_MAX = 20;

/**
 * The part of a teacher's profile students actually see: a short bio, the
 * subjects they teach, and years of experience. Editable even once approved
 * (unlike their name and ID). Subjects set here supplement the ones inferred
 * from a teacher's open classes.
 */
const PublicProfileForm = () => {
  const { toast } = useToast();
  const [bio, setBio] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [experience, setExperience] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    fetch("/api/teachers/profile")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!active) return;
        setBio(d.bio || "");
        setSubjects(Array.isArray(d.subjects) ? d.subjects : []);
        setExperience(d.experience != null ? String(d.experience) : "");
      })
      .catch(() => active && setLoadFailed(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const addSubject = (raw: string) => {
    const s = raw.trim();
    if (!s) return;
    setSubjects((prev) => {
      if (prev.length >= SUBJECT_MAX || prev.some((x) => x.toLowerCase() === s.toLowerCase())) return prev;
      return [...prev, s];
    });
    setDraft("");
  };

  const removeSubject = (s: string) => setSubjects((prev) => prev.filter((x) => x !== s));

  // Popular subjects not already picked, as quick-add buttons.
  const suggestions = useMemo(
    () => POPULAR_SUBJECTS.filter((s) => !subjects.some((x) => x.toLowerCase() === s.toLowerCase())),
    [subjects]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/teachers/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, subjects, experience: experience === "" ? null : Number(experience) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast({ title: "Profile saved", description: "Students will see this on your public profile." });
    } catch (err: unknown) {
      toast({ title: "Couldn't save", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  if (loadFailed) return <ProfileLoadError onRetry={() => setReloadKey((n) => n + 1)} />;

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="bio">About you</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
          rows={4}
          placeholder="Tell students how you teach, your approach, and what they can expect from your classes."
        />
        <p className="text-right text-xs text-muted-foreground">{bio.length}/{BIO_MAX}</p>
      </div>

      <div className="space-y-1.5">
        <Label>Subjects you teach</Label>
        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {s}
                <button type="button" onClick={() => removeSubject(s)} aria-label={`Remove ${s}`} className="rounded-full hover:text-primary/70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addSubject(draft);
              }
            }}
            placeholder="Add a subject, e.g. Combined Mathematics"
            disabled={subjects.length >= SUBJECT_MAX}
          />
          <Button type="button" variant="outline" onClick={() => addSubject(draft)} disabled={!draft.trim() || subjects.length >= SUBJECT_MAX}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        {suggestions.length > 0 && subjects.length < SUBJECT_MAX && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestions.slice(0, 8).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSubject(s)}
                className="rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">Shown on your profile and used when students filter by subject.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="experience">Years of teaching experience <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Input
          id="experience"
          type="number"
          min={0}
          max={60}
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className="sm:max-w-[160px]"
          placeholder="e.g. 3"
        />
      </div>

      <Button type="submit" disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Save profile
      </Button>
    </form>
  );
};

export default PublicProfileForm;
