'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import EmailVerificationBanner from "@/components/auth/EmailVerificationBanner";
import PersonalDetailsForm from "@/components/teacher/PersonalDetailsForm";
import { CurrencySettings } from "@/components/settings/CurrencySettings";
import { Loader2, Check, ArrowRight, UserCog, Lock, Bell, Landmark, Coins } from "lucide-react";

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
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </section>
);

const ProfileCompletionCard = () => {
  const [percent, setPercent] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/teachers/profile-completion")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPercent(d.percent ?? 0))
      .catch(() => {});
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border border-accent/40 bg-accent/[0.06] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Profile completion</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {percent === null ? "Loading…" : percent === 100 ? "Your profile is complete." : `${percent}% complete — finish to start teaching.`}
          </p>
        </div>
        <Button variant="hero" className="gap-2" asChild>
          <Link href="/teacher/profile-completion">
            {percent === 100 ? "Review profile" : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      {percent !== null && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
};

const ChangePasswordForm = () => {
  const { toast } = useToast();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Password updated" });
      setCurrent("");
      setNew("");
    } catch (err: unknown) {
      toast({ title: "Couldn't update", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} required minLength={8} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Update password
        </Button>
      </div>
    </form>
  );
};

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/teachers/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData({
          bankAccountName: d.bankAccountName || "",
          bankAccountNumber: d.bankAccountNumber || "",
          bankName: d.bankName || "",
          bankBranch: d.bankBranch || "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

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
      toast({ title: "Bank details saved" });
    } catch (err: unknown) {
      toast({ title: "Couldn't save", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="bankAccountName">Account holder name</Label>
        <Input id="bankAccountName" value={data.bankAccountName} onChange={set("bankAccountName")} placeholder="Jane A. Perera" />
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

const TeacherSettings = () => {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, security, notifications and payouts.</p>
      </div>

      <ProfileCompletionCard />

      <Section icon={Bell} title="Email verification" description="Confirm your account email address.">
        <EmailVerificationBanner variant="card" />
      </Section>

      <Section icon={UserCog} title="Personal details" description="Edit your name, contacts and address.">
        <PersonalDetailsForm />
      </Section>

      <Section icon={Lock} title="Password" description="Change your account password.">
        <ChangePasswordForm />
      </Section>

      <Section icon={Coins} title="Currency" description="Your account and payment currency.">
        <CurrencySettings />
      </Section>

      <Section icon={Bell} title="Notifications" description="Choose how you'd like to be notified.">
        <NotificationPrefs />
      </Section>

      <Section icon={Landmark} title="Bank details" description="Used for withdrawing your earnings.">
        <BankDetailsForm />
      </Section>
    </div>
  );
};

export default TeacherSettings;
