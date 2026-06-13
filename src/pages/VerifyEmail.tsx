'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

type Phase = "loading" | "ready" | "sending" | "code-sent" | "verifying" | "done";

const VerifyEmail = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>("loading");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState<string>("");

  const dashboardPath = user?.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard";

  // On load: if already verified, bounce to the dashboard; otherwise show the send prompt.
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (!active) return;
        if (!u) {
          router.replace("/auth");
          return;
        }
        setEmail(u.email || "");
        if (u.emailVerified) {
          router.replace(dashboardPath);
        } else {
          setPhase("ready");
        }
      })
      .catch(() => active && setPhase("ready"));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendCode = async () => {
    setPhase("sending");
    try {
      const res = await fetch("/api/auth/send-otp", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");

      setPhase("code-sent");
      if (data.devCode) {
        toast({ title: "Dev mode — code not emailed", description: `Your code is ${data.devCode}` });
      } else {
        toast({ title: "Code sent", description: "Check your inbox for the 6-digit code." });
      }
    } catch (err: unknown) {
      setPhase("ready");
      toast({
        title: "Couldn't send code",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const verify = async (value: string) => {
    setPhase("verifying");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      setPhase("done");
      toast({ title: "Email verified ✓", description: "Redirecting to your dashboard…" });
      setTimeout(() => router.replace(dashboardPath), 1200);
    } catch (err: unknown) {
      setPhase("code-sent");
      setCode("");
      toast({
        title: "Verification failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const onCodeChange = (value: string) => {
    setCode(value);
    if (value.length === 6) verify(value);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 grain">
      <div className="absolute -top-40 right-[-10%] -z-10 h-[520px] w-[520px] rounded-full bg-primary/[0.06] blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] -z-10 h-[420px] w-[420px] rounded-full bg-secondary/[0.07] blur-3xl" />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-hero shadow-soft">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              Mini<span className="font-serif italic font-normal">Uni</span>
            </span>
          </Link>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-elevated">
          {phase === "done" ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
              </div>
              <h1 className="text-2xl font-semibold">Email verified</h1>
              <p className="mt-2 text-sm text-muted-foreground">Taking you to your dashboard…</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="h-6 w-6" strokeWidth={1.75} />
              </div>

              <h1 className="text-2xl font-semibold">Verify your email</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {phase === "code-sent" || phase === "verifying" ? (
                  <>
                    Enter the 6-digit code we sent to{" "}
                    <span className="font-medium text-foreground">{email || "your email"}</span>.
                  </>
                ) : (
                  <>
                    We&apos;ll send a 6-digit code to{" "}
                    <span className="font-medium text-foreground">{email || "your email"}</span> to confirm it&apos;s you.
                  </>
                )}
              </p>

              {phase === "code-sent" || phase === "verifying" ? (
                <div className="mt-8 flex flex-col items-center gap-5">
                  <InputOTP maxLength={6} value={code} onChange={onCodeChange} disabled={phase === "verifying"}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>

                  {phase === "verifying" ? (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                    </span>
                  ) : (
                    <button onClick={sendCode} className="text-sm font-medium text-primary hover:underline">
                      Didn&apos;t get it? Resend code
                    </button>
                  )}
                </div>
              ) : (
                <Button
                  variant="hero"
                  size="lg"
                  className="mt-8 w-full gap-2"
                  onClick={sendCode}
                  disabled={phase === "loading" || phase === "sending"}
                >
                  {phase === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    "Send verification code"
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href={dashboardPath}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
