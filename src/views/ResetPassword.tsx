'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AuthCardShell from "@/components/auth/AuthCardShell";

const MIN_LENGTH = 8;

const ResetPassword = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const uid = searchParams?.get("uid") || "";
  const token = searchParams?.get("token") || "";

  const [valid, setValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check the link first, so an expired one says so before anything is typed.
  useEffect(() => {
    if (!uid || !token) {
      setValid(false);
      return;
    }
    fetch(`/api/auth/reset-password?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setValid(Boolean(d.valid)))
      .catch(() => setValid(false));
  }, [uid, token]);

  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= MIN_LENGTH && confirm === password && !saving;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "INVALID_LINK") setValid(false);
        setError(data.error || "Couldn't reset your password");
        return;
      }
      toast({ title: "Password updated", description: "Log in with your new password." });
      router.push("/auth");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (valid === null) {
    return (
      <AuthCardShell title="Reset your password">
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AuthCardShell>
    );
  }

  if (!valid) {
    return (
      <AuthCardShell title="This link has expired" subtitle="Reset links work for 30 minutes and only once. Request a new one and use the latest email.">
        <Button variant="hero" className="h-12 w-full" asChild>
          <Link href="/forgot-password">Send a new link</Link>
        </Button>
      </AuthCardShell>
    );
  }

  const field = (id: string, label: string, value: string, onChange: (v: string) => void, hint?: string | false) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={show ? "text" : "password"}
          className="h-12 pl-10 pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          required
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {hint && <p className="text-xs text-destructive">{hint}</p>}
    </div>
  );

  return (
    <AuthCardShell title="Choose a new password" subtitle={`Use at least ${MIN_LENGTH} characters.`}>
      <form onSubmit={submit} className="space-y-5">
        {error && <p className="rounded-xl border border-destructive/30 bg-destructive/[0.06] p-3 text-sm text-destructive">{error}</p>}
        {field("password", "New password", password, setPassword, tooShort && `At least ${MIN_LENGTH} characters`)}
        {field("confirm", "Confirm new password", confirm, setConfirm, mismatch && "Passwords don't match")}
        <Button type="submit" variant="hero" className="h-12 w-full" disabled={!canSubmit}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
        </Button>
      </form>
    </AuthCardShell>
  );
};

export default ResetPassword;
