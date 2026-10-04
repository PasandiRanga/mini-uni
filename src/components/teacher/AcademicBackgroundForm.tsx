'use client';

import { useEffect, useState } from "react";
import ProfileLoadError from "@/components/teacher/ProfileLoadError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, GraduationCap, BookOpen, Briefcase } from "lucide-react";
import { SuggestInput } from "@/components/ui/suggest-input";
import { AL_STREAMS, COUNTRIES, DEFAULT_COUNTRY, PROFESSIONS, UNIVERSITY_GROUPS, WORKING_STATUSES, examYearOptions, isSriLankanUniversity } from "@/lib/profileOptions";

type Employment = "STUDENT" | "UNDERGRADUATE" | "GRADUATE";

const OPTIONS: { value: Employment; label: string; icon: typeof GraduationCap; hint: string }[] = [
  { value: "STUDENT", label: "Student", icon: BookOpen, hint: "Currently in school" },
  { value: "UNDERGRADUATE", label: "Undergraduate", icon: GraduationCap, hint: "Pursuing a degree" },
  { value: "GRADUATE", label: "Graduate", icon: Briefcase, hint: "Completed studies" },
];

type Academic = {
  employmentStatus: Employment | "";
  universityName: string;
  universityCountry: string;
  stream: string;
  examYear: string;
  workingStatus: string;
  profession: string;
  employer: string;
};

const EMPTY: Academic = {
  employmentStatus: "",
  universityName: "",
  universityCountry: "",
  stream: "",
  examYear: "",
  workingStatus: "",
  profession: "",
  employer: "",
};

interface AcademicBackgroundFormProps {
  onSaved?: () => void;
}

const AcademicBackgroundForm = ({ onSaved }: AcademicBackgroundFormProps) => {
  const { toast } = useToast();
  const [data, setData] = useState<Academic>(EMPTY);
  const [loading, setLoading] = useState(true);
  // Set when the saved values failed to load: the form is hidden so blanks are never saved.
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);

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
        if (active && d) setData({ ...EMPTY, ...{
          employmentStatus: d.employmentStatus || "",
          universityName: d.universityName || "",
          universityCountry: d.universityCountry || DEFAULT_COUNTRY,
          stream: d.stream || "",
          examYear: d.examYear || "",
          workingStatus: d.workingStatus || "",
          profession: d.profession || "",
          employer: d.employer || "",
        } });
      })
      .catch(() => active && setLoadFailed(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const set = (key: keyof Academic) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((d) => ({ ...d, [key]: e.target.value }));

  const isStudent = data.employmentStatus === "STUDENT" || data.employmentStatus === "UNDERGRADUATE";
  const isSchoolStudent = data.employmentStatus === "STUDENT";
  // Picking a listed Sri Lankan university fixes the country to Sri Lanka.
  const countryLocked = data.employmentStatus === "UNDERGRADUATE" && isSriLankanUniversity(data.universityName);
  const isGraduate = data.employmentStatus === "GRADUATE";
  const notWorking = data.workingStatus === "Not currently working";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.employmentStatus) {
      toast({ title: "Select your status", variant: "destructive" });
      return;
    }
    if (isStudent && (!data.universityName.trim() || !data.universityCountry.trim())) {
      toast({
        title: "Missing details",
        description: isSchoolStudent ? "School name and country are required." : "University and country are required.",
        variant: "destructive",
      });
      return;
    }
    if (isSchoolStudent && (!data.stream || !data.examYear)) {
      toast({ title: "Missing details", description: "Pick your A/L stream and exam year.", variant: "destructive" });
      return;
    }
    if (isGraduate && (!data.workingStatus.trim() || !data.profession.trim() || (!notWorking && !data.employer.trim()))) {
      toast({
        title: "Missing details",
        description: notWorking ? "Working status and profession are required." : "Working status, profession and employer are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/teachers/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save");
      toast({ title: "Saved", description: "Academic background updated." });
      onSaved?.();
    } catch (err: unknown) {
      toast({ title: "Couldn't save", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loadFailed && !loading) return <ProfileLoadError onRetry={() => setReloadKey((n) => n + 1)} />;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const field = (id: keyof Academic, label: string, placeholder: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} <span className="text-primary">*</span>
      </Label>
      <Input id={id} value={data[id]} onChange={set(id)} placeholder={placeholder} />
    </div>
  );

  // A short, fixed set of answers: one click, no typing.
  const chips = (id: keyof Academic, label: string, options: readonly string[]) => (
    <div className="space-y-2.5">
      <Label>
        {label} <span className="text-primary">*</span>
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = data[id] === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setData((d) => ({ ...d, [id]: option }))}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                active
                  ? "border-primary bg-primary/[0.08] font-medium text-foreground"
                  : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Pick from common answers, or type your own.
  const suggest = (id: keyof Academic, label: string, options: readonly string[], placeholder: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} <span className="text-primary">*</span>
      </Label>
      <SuggestInput
        id={id}
        value={data[id]}
        onChange={(value) => setData((d) => ({ ...d, [id]: value }))}
        options={options}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2.5">
        <Label>
          Current status <span className="text-primary">*</span>
        </Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {OPTIONS.map((o) => {
            const active = data.employmentStatus === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setData((d) => ({ ...d, employmentStatus: o.value }))}
                className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-300 ${
                  active
                    ? "border-primary bg-primary/[0.06] shadow-soft"
                    : "border-border/70 hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <o.icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.75} />
                <span className="text-sm font-medium">{o.label}</span>
                <span className="text-xs text-muted-foreground">{o.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isStudent && (
        <div className="grid gap-5 sm:grid-cols-2">
          {data.employmentStatus === "STUDENT"
            ? field("universityName", "School name", "Royal College, Colombo")
            : (
              <div className="space-y-1.5">
                <Label htmlFor="universityName">
                  University <span className="text-primary">*</span>
                </Label>
                <SuggestInput
                  id="universityName"
                  value={data.universityName}
                  // A Sri Lankan university settles the country; anything typed by hand leaves it editable.
                  onChange={(universityName) =>
                    setData((d) => ({
                      ...d,
                      universityName,
                      ...(isSriLankanUniversity(universityName) ? { universityCountry: DEFAULT_COUNTRY } : {}),
                    }))
                  }
                  groups={UNIVERSITY_GROUPS}
                  placeholder="Select your university"
                  searchPlaceholder="Search, or type one that isn't listed…"
                />
              </div>
            )}
          <div className="space-y-1.5">
            <Label htmlFor="universityCountry">
              Country <span className="text-primary">*</span>
            </Label>
            <SuggestInput
              id="universityCountry"
              value={data.universityCountry}
              onChange={(universityCountry) => setData((d) => ({ ...d, universityCountry }))}
              options={COUNTRIES}
              placeholder="Select a country"
              locked={countryLocked}
            />
            {countryLocked && <p className="text-xs text-muted-foreground">Set from your university.</p>}
          </div>
        </div>
      )}

      {isSchoolStudent && (
        <div className="space-y-5">
          {chips("stream", "A/L stream", AL_STREAMS)}
          {chips("examYear", "A/L exam year", examYearOptions())}
        </div>
      )}

      {isGraduate && (
        <div className="space-y-5">
          <div className="space-y-2.5">
            <Label>
              Working status <span className="text-primary">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {WORKING_STATUSES.map((status) => {
                const active = data.workingStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setData((d) => ({ ...d, workingStatus: status }))}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      active
                        ? "border-primary bg-primary/[0.08] font-medium text-foreground"
                        : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {suggest("profession", "Profession", PROFESSIONS, "Select your profession")}
            {!notWorking &&
              field("employer", "Employer", data.workingStatus === "Self-employed" || data.workingStatus === "Freelance" ? "Your business name, or “Self”" : "Acme Corp")}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Check className="h-4 w-4" /> Save details
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default AcademicBackgroundForm;
