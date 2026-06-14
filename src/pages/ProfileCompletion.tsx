'use client';

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PersonalDetailsForm from "@/components/teacher/PersonalDetailsForm";
import IdentityVerificationForm from "@/components/teacher/IdentityVerificationForm";
import AcademicBackgroundForm from "@/components/teacher/AcademicBackgroundForm";
import { ArrowLeft, Check, GraduationCap, PartyPopper } from "lucide-react";

type StepKey = "personal" | "identity" | "academic";
type CompletionStep = { key: StepKey; label: string; complete: boolean };

const STEP_ORDER: StepKey[] = ["personal", "identity", "academic"];
const STEP_META: Record<StepKey, { title: string; blurb: string }> = {
  personal: { title: "Personal details", blurb: "Tell us who you are and how to reach you." },
  identity: { title: "Identity verification", blurb: "Upload a government document so we can verify you." },
  academic: { title: "Academic background", blurb: "Share your education or professional background." },
};

const ProfileCompletion = () => {
  const router = useRouter();
  const [current, setCurrent] = useState<StepKey>("personal");
  const [percent, setPercent] = useState(0);
  const [steps, setSteps] = useState<CompletionStep[]>([]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/teachers/profile-completion");
      if (res.ok) {
        const data = await res.json();
        setPercent(data.percent ?? 0);
        setSteps(data.steps ?? []);
        return data;
      }
    } catch {
      /* ignore */
    }
    return null;
  }, []);

  useEffect(() => {
    // Start on the first incomplete step
    refresh().then((data) => {
      if (data?.steps) {
        const firstIncomplete = (data.steps as CompletionStep[]).find((s) => !s.complete);
        if (firstIncomplete) setCurrent(firstIncomplete.key);
      }
    });
  }, [refresh]);

  const stepComplete = (key: StepKey) => steps.find((s) => s.key === key)?.complete ?? false;
  const currentIndex = STEP_ORDER.indexOf(current);

  const handleSaved = async () => {
    await refresh();
    // Advance to the next step if there is one
    const next = STEP_ORDER[currentIndex + 1];
    if (next) setCurrent(next);
  };

  const allDone = percent === 100;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background grain">
      <div className="absolute -top-40 right-[-10%] -z-10 h-[480px] w-[480px] rounded-full bg-primary/[0.05] blur-3xl" />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-warm">
              <GraduationCap className="h-5 w-5 text-secondary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Mini<span className="font-serif italic font-normal">Uni</span>
            </span>
          </Link>
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>

        <div className="mb-2">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Complete your <span className="font-serif italic font-normal text-gradient">profile</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Finish all three steps to start teaching. Your progress is saved as you go.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">{percent}% complete</span>
            {allDone && <span className="text-success">All steps done ✓</span>}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-secondary to-accent transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {allDone ? (
          <div className="rounded-3xl border border-success/40 bg-success/[0.07] p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <PartyPopper className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <h2 className="text-xl font-semibold">Profile complete</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Your profile has been submitted. Our team will review your documents and update your verification status soon.
            </p>
            <Button variant="hero" className="mt-6" onClick={() => router.push("/teacher/dashboard")}>
              Back to dashboard
            </Button>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="mb-8 grid grid-cols-3 gap-3">
              {STEP_ORDER.map((key, i) => {
                const done = stepComplete(key);
                const active = current === key;
                return (
                  <button
                    key={key}
                    onClick={() => setCurrent(key)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300 ${
                      active ? "border-primary bg-primary/[0.05] shadow-soft" : "border-border/70 hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        done
                          ? "bg-success text-success-foreground"
                          : active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className="hidden text-sm font-medium sm:block">{STEP_META[key].title}</span>
                  </button>
                );
              })}
            </div>

            {/* Active step form */}
            <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">{STEP_META[current].title}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{STEP_META[current].blurb}</p>
              </div>

              {current === "personal" && <PersonalDetailsForm onSaved={handleSaved} />}
              {current === "identity" && <IdentityVerificationForm onSaved={handleSaved} />}
              {current === "academic" && <AcademicBackgroundForm onSaved={handleSaved} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileCompletion;
