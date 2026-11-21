'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, ArrowRight, GraduationCap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

/** After a first-time Google sign-in, the user picks student or teacher here. */
const GoogleRoleSelect = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [firstName, setFirstName] = useState<string>("");
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState<"STUDENT" | "TEACHER" | null>(null);

  // Confirm a Google sign-up is actually in progress; otherwise send to /auth.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/google/complete");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFirstName(data.firstName || "");
      } catch {
        router.replace("/auth");
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  const choose = async (role: "STUDENT" | "TEACHER") => {
    setSubmitting(role);
    try {
      const res = await fetch("/api/auth/google/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't finish signing up");
      await refreshUser();
      router.replace(data.redirect || "/student/dashboard");
    } catch (err: unknown) {
      toast({ title: "Couldn't finish", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
      setSubmitting(null);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-primary/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-accent/[0.06] blur-3xl" />
      <div className="relative w-full max-w-4xl">
        <div className="mb-10 text-center">
          <Link href="/" className="mb-4 inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-hero shadow-soft">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">MiniUni</span>
          </Link>
          <h1 className="type-page-title mb-2">
            {firstName ? `Welcome, ` : "Welcome"}
            {firstName && <span className="font-serif font-semibold">{firstName}</span>}
          </h1>
          <p className="text-muted-foreground">How will you use MiniUni?</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="group border-2 border-border/70 bg-card/85 transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-elevated">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">I want to learn</CardTitle>
              <CardDescription>Find verified teachers and book classes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="hero" className="w-full" disabled={!!submitting} onClick={() => choose("STUDENT")}>
                {submitting === "STUDENT" ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue as Student <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </CardContent>
          </Card>

          <Card className="group border-2 border-border/70 bg-card/85 transition-all hover:-translate-y-1 hover:border-secondary/60 hover:shadow-elevated">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle className="text-2xl">I want to teach</CardTitle>
              <CardDescription>Offer classes. You'll complete a short profile and get verified.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="warm" className="w-full" disabled={!!submitting} onClick={() => choose("TEACHER")}>
                {submitting === "TEACHER" ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue as Teacher <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GoogleRoleSelect;
