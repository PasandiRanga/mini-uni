'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, GraduationCap, BookOpen, Briefcase } from "lucide-react";

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
  workingStatus: string;
  profession: string;
  employer: string;
};

const EMPTY: Academic = {
  employmentStatus: "",
  universityName: "",
  universityCountry: "",
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/teachers/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) setData({ ...EMPTY, ...{
          employmentStatus: d.employmentStatus || "",
          universityName: d.universityName || "",
          universityCountry: d.universityCountry || "",
          workingStatus: d.workingStatus || "",
          profession: d.profession || "",
          employer: d.employer || "",
        } });
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const set = (key: keyof Academic) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((d) => ({ ...d, [key]: e.target.value }));

  const isStudent = data.employmentStatus === "STUDENT" || data.employmentStatus === "UNDERGRADUATE";
  const isGraduate = data.employmentStatus === "GRADUATE";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.employmentStatus) {
      toast({ title: "Select your status", variant: "destructive" });
      return;
    }
    if (isStudent && (!data.universityName.trim() || !data.universityCountry.trim())) {
      toast({ title: "Missing details", description: "University name and country are required.", variant: "destructive" });
      return;
    }
    if (isGraduate && (!data.workingStatus.trim() || !data.profession.trim() || !data.employer.trim())) {
      toast({ title: "Missing details", description: "Working status, profession and employer are required.", variant: "destructive" });
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
        {label} <span className="text-secondary">*</span>
      </Label>
      <Input id={id} value={data[id]} onChange={set(id)} placeholder={placeholder} />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2.5">
        <Label>
          Current status <span className="text-secondary">*</span>
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
          {field("universityName", "University name", "University of Colombo")}
          {field("universityCountry", "University country", "Sri Lanka")}
        </div>
      )}

      {isGraduate && (
        <div className="space-y-5">
          {field("workingStatus", "Working status", "Employed full-time")}
          <div className="grid gap-5 sm:grid-cols-2">
            {field("profession", "Profession", "Software Engineer")}
            {field("employer", "Employer", "Acme Corp")}
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
