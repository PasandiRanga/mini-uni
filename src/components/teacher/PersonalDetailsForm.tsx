'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Check, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { SuggestInput } from "@/components/ui/suggest-input";
import { COUNTRIES, initialsFromFullName } from "@/lib/profileOptions";

type Details = {
  email: string;
  fullName: string;
  nameWithInitials: string;
  contactNumber: string;
  contactNumber2: string;
  address: string;
  country: string;
  postalCode: string;
};

const EMPTY: Details = {
  email: "",
  fullName: "",
  nameWithInitials: "",
  contactNumber: "",
  contactNumber2: "",
  address: "",
  country: "",
  postalCode: "",
};

interface PersonalDetailsFormProps {
  /** Called after a successful save (e.g. to advance to the next tab). */
  onSaved?: () => void;
}

const PersonalDetailsForm = ({ onSaved }: PersonalDetailsFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const emailVerified = Boolean(user?.emailVerified);
  const [data, setData] = useState<Details>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Fields the server filled in from sign-up, shown as a hint to confirm them.
  const [prefilled, setPrefilled] = useState<string[]>([]);
  // Name with initials follows the full name until the teacher edits it themselves.
  const [initialsEdited, setInitialsEdited] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/teachers/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return;
        setData({ ...EMPTY, ...d });
        const filled = d.prefilled ? String(d.prefilled).split(",").filter(Boolean) : [];
        setPrefilled(filled);
        // Saved initials that don't match the generated ones were typed by hand.
        setInitialsEdited(Boolean(d.nameWithInitials) && d.nameWithInitials !== initialsFromFullName(d.fullName || ""));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const set = (key: keyof Details) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (key === "nameWithInitials") setInitialsEdited(true);
    setData((d) => ({
      ...d,
      [key]: value,
      ...(key === "fullName" && !initialsEdited ? { nameWithInitials: initialsFromFullName(value) } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.country.trim()) {
      toast({ title: "Select your country", variant: "destructive" });
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

      setPrefilled([]);
      toast({ title: "Saved", description: "Your personal details have been updated." });
      onSaved?.();
    } catch (err: unknown) {
      toast({
        title: "Couldn't save",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
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

  const field = (
    id: keyof Details,
    label: string,
    opts: {
      required?: boolean;
      type?: string;
      placeholder?: string;
      readOnly?: boolean;
      hint?: string;
      inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
      autoComplete?: string;
    } = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {opts.required && <span className="text-primary"> *</span>}
        {!opts.required && !opts.readOnly && <span className="text-muted-foreground font-normal"> (optional)</span>}
      </Label>
      <Input
        id={id}
        type={opts.type || "text"}
        value={data[id]}
        onChange={set(id)}
        placeholder={opts.placeholder}
        required={opts.required}
        readOnly={opts.readOnly}
        inputMode={opts.inputMode}
        autoComplete={opts.autoComplete}
        className={opts.readOnly ? "bg-muted/50 text-muted-foreground" : ""}
      />
      {opts.hint && <p className="text-xs text-muted-foreground">{opts.hint}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {prefilled.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.05] px-4 py-3 text-sm">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            We&apos;ve filled in what you gave us when you signed up. Check it, add the rest, and save.
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {field("fullName", "Full name", { required: true, placeholder: "Jane Amara Perera", autoComplete: "name" })}
        {field("nameWithInitials", "Name with initials", {
          required: true,
          placeholder: "J. A. Perera",
          hint: initialsEdited ? undefined : "Filled in from your full name — edit if it's different.",
        })}
        {field("contactNumber", "Primary contact number", {
          required: true,
          type: "tel",
          inputMode: "tel",
          autoComplete: "tel",
          placeholder: "+94 77 123 4567",
        })}
        {field("contactNumber2", "Secondary contact number", { type: "tel", inputMode: "tel", placeholder: "+94 11 234 5678" })}
      </div>

      {/* Email — read-only with an inline verification indicator */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Input id="email" type="email" value={data.email} readOnly className="bg-muted/50 pr-10 text-muted-foreground" />
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                {emailVerified ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-success" tabIndex={0}>
                    <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={2} />
                  </span>
                ) : (
                  <Link href="/verify-email" className="absolute right-3 top-1/2 -translate-y-1/2 text-warning">
                    <ShieldAlert className="h-[18px] w-[18px]" strokeWidth={2} />
                  </Link>
                )}
              </TooltipTrigger>
              <TooltipContent>
                {emailVerified ? "Email verified" : "Email not verified — click to verify"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {field("address", "Address", { required: true, placeholder: "123 Main Street, Colombo", autoComplete: "street-address" })}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="country">
            Country<span className="text-primary"> *</span>
          </Label>
          <SuggestInput
            id="country"
            value={data.country}
            onChange={(country) => setData((d) => ({ ...d, country }))}
            options={COUNTRIES}
            placeholder="Select your country"
            searchPlaceholder="Search countries…"
          />
        </div>
        {field("postalCode", "Postal code", {
          required: true,
          inputMode: "numeric",
          autoComplete: "postal-code",
          placeholder: "00100",
        })}
      </div>

      <div className="flex items-center gap-3 pt-2">
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

export default PersonalDetailsForm;
