'use client';

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Users, RefreshCw, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  classCount: number;
  completedCount: number;
  subjects: string[];
  lastClass: string | null;
}

const TeacherStudents = () => {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teachers/students");
      if (res.ok) setStudents(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
        <h2 className="text-lg font-semibold">
          Your <span className="font-serif font-normal">students</span>
          {students.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({students.length})</span>}
        </h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={fetchStudents} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <div className="p-6">
        {loading && students.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : students.length === 0 ? (
          <div className="py-10 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">No students yet. They&apos;ll appear here once you have confirmed or completed classes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((s) => {
              const name = `${s.firstName} ${s.lastName}`.trim();
              const initials = `${s.firstName?.[0] || ""}${s.lastName?.[0] || ""}`.toUpperCase();
              return (
                <div key={s.id} className="flex items-center gap-4 rounded-2xl border border-border/70 bg-background/40 p-4 transition-colors hover:bg-muted/40">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full gradient-hero text-sm font-semibold text-primary-foreground">
                    {initials || "S"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.subjects.length ? s.subjects.join(", ") : "—"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="flex items-center justify-end gap-1 text-sm font-medium">
                      <GraduationCap className="h-3.5 w-3.5 text-primary" />
                      {s.classCount} {s.classCount === 1 ? "class" : "classes"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.completedCount} completed
                      {s.lastClass ? ` · last ${format(new Date(s.lastClass), "MMM d")}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default TeacherStudents;
