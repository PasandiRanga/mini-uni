'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import PersonalDetailsForm from "@/components/teacher/PersonalDetailsForm";
import PublicProfileForm from "@/components/teacher/PublicProfileForm";
import ProfileLoadError from "@/components/teacher/ProfileLoadError";
import IdentityVerificationForm from "@/components/teacher/IdentityVerificationForm";
import AcademicBackgroundForm from "@/components/teacher/AcademicBackgroundForm";
import { CurrencySettings } from "@/components/settings/CurrencySettings";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { Loader2, Check, UserCog, Lock, Bell, Landmark, Coins, ShieldCheck, GraduationCap, Sparkles, CalendarCheck, Video } from "lucide-react";

const Section = ({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof UserCog;
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
    <div className="flex items-start gap-3 border-b border-border/60 px-6 py-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </section>
);

const GroupHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="type-eyebrow px-1 pb-1 pt-2">{children}</h3>
);

const NotificationPrefs = () => {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({ notifyEmail: true, notifyInApp: true });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPrefs({ notifyEmail: d.notifyEmail, notifyInApp: d.notifyInApp }))
      .finally(() => setLoaded(true));
  }, []);

  const toggle = async (key: "notifyEmail" | "notifyInApp", value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    try {
      await fetch("/api/auth/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch {
      toast({ title: "Couldn't save preference", variant: "destructive" });
    }
  };

  if (!loaded) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Email notifications</p>
          <p className="text-xs text-muted-foreground">Bookings, inquiries and updates by email.</p>
        </div>
        <Switch checked={prefs.notifyEmail} onCheckedChange={(v) => toggle("notifyEmail", v)} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">In-app notifications</p>
          <p className="text-xs text-muted-foreground">Show alerts in your dashboard bell.</p>
        </div>
        <Switch checked={prefs.notifyInApp} onCheckedChange={(v) => toggle("notifyInApp", v)} />
      </div>
    </div>
  );
};

const BankDetailsForm = () => {
  const { toast } = useToast();
  const [data, setData] = useState({ bankAccountName: "", bankAccountNumber: "", bankName: "", bankBranch: "" });
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  // True when the holder name was filled in from the profile and not yet saved.
  const [holderPrefilled, setHolderPrefilled] = useState(false);

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
        // Banks print the name with initials, so suggest that for a new account.
        const holder = d.bankAccountName || d.nameWithInitials || d.fullName || "";
        setHolderPrefilled(!d.bankAccountName && Boolean(holder));
        setData({
          bankAccountName: holder,
          bankAccountNumber: d.bankAccountNumber || "",
          bankName: d.bankName || "",
          bankBranch: d.bankBranch || "",
        });
      })
      .catch(() => active && setLoadFailed(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const set = (key: keyof typeof data) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((d) => ({ ...d, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/teachers/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setHolderPrefilled(false);
      toast({ title: "Bank details saved" });
    } catch (err: unknown) {
      toast({ title: "Couldn't save", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  if (loadFailed) return <ProfileLoadError onRetry={() => setReloadKey((n) => n + 1)} />;

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="bankAccountName">Account holder name</Label>
        <Input id="bankAccountName" value={data.bankAccountName} onChange={set("bankAccountName")} placeholder="J. A. Perera" />
        {holderPrefilled && <p className="text-xs text-muted-foreground">From your profile. Change it if your bank uses a different name.</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bankAccountNumber">Account number</Label>
        <Input id="bankAccountNumber" value={data.bankAccountNumber} onChange={set("bankAccountNumber")} placeholder="0012345678" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bankName">Bank name</Label>
        <Input id="bankName" value={data.bankName} onChange={set("bankName")} placeholder="Commercial Bank" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bankBranch">Branch</Label>
        <Input id="bankBranch" value={data.bankBranch} onChange={set("bankBranch")} placeholder="Colombo Main" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save bank details
        </Button>
      </div>
    </form>
  );
};

const GoogleCalendarSettings = () => {
  const { toast } = useToast();
  const [state, setState] = useState<{ configured: boolean; connected: boolean; email: string | null } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch("/api/google")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setState(d))
      .catch(() => setState({ configured: false, connected: false, email: null }));
  };

  useEffect(() => {
    load();
    // Google redirects back with ?google=connected|error|denied — surface it once.
    const params = new URLSearchParams(window.location.search);
    const result = params.get("google");
    if (result) {
      const messages: Record<string, { title: string; variant?: "destructive" }> = {
        connected: { title: "Google Calendar connected" },
        denied: { title: "Connection cancelled", variant: "destructive" },
        error: { title: "Couldn't connect Google — try again", variant: "destructive" },
      };
      const m = messages[result];
      if (m) toast({ title: m.title, variant: m.variant });
      params.delete("google");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnect = async () => {
    setBusy(true);
    try {
      await fetch("/api/google", { method: "DELETE" });
      toast({ title: "Google Calendar disconnected" });
      load();
    } finally {
      setBusy(false);
    }
  };

  if (!state) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!state.configured) {
    return (
      <p className="text-sm text-muted-foreground">
        Google Calendar isn&apos;t set up on this site yet. Once it is, you&apos;ll be able to connect your account here so booked classes get a Meet link automatically.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Connect your Google account and every booked class is added to your calendar with a Google Meet link — the student gets the invite too.
      </p>
      {state.connected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3 text-sm">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            Connected{state.email ? ` as ${state.email}` : ""}
          </span>
          <Button variant="outline" size="sm" onClick={disconnect} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Disconnect
          </Button>
        </div>
      ) : (
        <Button variant="hero" onClick={() => { window.location.href = "/api/google/connect"; }}>
          <Video className="h-4 w-4" /> Connect Google Calendar
        </Button>
      )}
    </div>
  );
};

const TeacherSettings = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="type-title">
          <span className="font-serif text-gradient font-semibold">Settings</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, security, notifications and payouts. You can complete your profile here or in the step-by-step flow — both stay in sync.
        </p>
      </div>

      {/* Profile — same fields as profile completion, editable and prefilled */}
      <div className="space-y-4">
        <GroupHeading>Profile</GroupHeading>
        <Section icon={Sparkles} title="Public profile" description="Your bio and subjects — what students see.">
          <PublicProfileForm />
        </Section>
        <Section icon={UserCog} title="Personal details" description="Your name, contacts and address.">
          <PersonalDetailsForm />
        </Section>
        <Section icon={ShieldCheck} title="Identity verification" description="Your ID type and document scans.">
          <IdentityVerificationForm />
        </Section>
        <Section icon={GraduationCap} title="Academic & professional" description="Your education and work background.">
          <AcademicBackgroundForm />
        </Section>
      </div>

      {/* Account */}
      <div className="space-y-4">
        <GroupHeading>Account</GroupHeading>
        <Section icon={Lock} title="Password" description="Change your account password.">
          <ChangePasswordForm />
        </Section>
        <Section icon={Coins} title="Currency" description="Your account and payment currency.">
          <CurrencySettings />
        </Section>
        <Section icon={Bell} title="Notifications" description="Choose how you'd like to be notified.">
          <NotificationPrefs />
        </Section>
      </div>

      {/* Classes */}
      <div className="space-y-4">
        <GroupHeading>Classes</GroupHeading>
        <Section icon={CalendarCheck} title="Google Calendar & Meet" description="Auto-add booked classes to your calendar with a Meet link.">
          <GoogleCalendarSettings />
        </Section>
      </div>

      {/* Payouts */}
      <div className="space-y-4">
        <GroupHeading>Payouts</GroupHeading>
        <Section icon={Landmark} title="Bank details" description="Used for withdrawing your earnings.">
          <BankDetailsForm />
        </Section>
      </div>
    </div>
  );
};

export default TeacherSettings;
