'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthCardShell from "@/components/auth/AuthCardShell";

const ForgotPassword = () => {
  const searchParams = useSearchParams();
  // Carried over from the login form, so it doesn't have to be retyped.
  const [email, setEmail] = useState(searchParams?.get("email") || "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<{ message: string; notFound?: boolean } | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.retryAfter) setCooldown(data.retryAfter);
        setError({ message: data.error || "Couldn't send the link", notFound: data.code === "ACCOUNT_NOT_FOUND" });
        return;
      }
      setSentTo(email.trim());
      setDevLink(data.devLink || null);
      setCooldown(data.retryAfter || 60);
    } catch {
      setError({ message: "Couldn't reach the server. Check your connection and try again." });
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <AuthCardShell title="Check your email" subtitle={<>We sent a reset link to <span className="font-medium text-foreground">{sentTo}</span>. It works for 30 minutes.</>}>
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>Didn&apos;t get it? Check your spam folder, or send it again.</p>
          </div>
          {devLink && (
            <p className="break-all rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
              Dev only (no email set up): <a href={devLink} className="text-primary underline">{devLink}</a>
            </p>
          )}
          <Button variant="outline" className="h-12 w-full" onClick={() => send()} disabled={sending || cooldown > 0}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : cooldown > 0 ? `Send again in ${cooldown}s` : "Send again"}
          </Button>
          <Link href="/auth" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to log in
          </Link>
        </div>
      </AuthCardShell>
    );
  }

  return (
    <AuthCardShell title="Forgot your password?" subtitle="Enter your account email and we'll send you a link to choose a new one.">
      <form onSubmit={send} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-border/70 bg-muted/40 p-4 text-sm">
            <p className="font-medium">{error.message}</p>
            {error.notFound && (
              <p className="mt-1 text-muted-foreground">
                Check the email for typos, or{" "}
                <Link href="/signup" className="font-medium text-primary hover:underline">create an account</Link>.
              </p>
            )}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="h-12 pl-10"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              autoComplete="email"
              autoFocus
              required
            />
          </div>
        </div>
        <Button type="submit" variant="hero" className="h-12 w-full" disabled={sending || !email.trim() || cooldown > 0}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : cooldown > 0 ? `Try again in ${cooldown}s` : "Send reset link"}
        </Button>
        <Link href="/auth" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to log in
        </Link>
      </form>
    </AuthCardShell>
  );
};

export default ForgotPassword;
