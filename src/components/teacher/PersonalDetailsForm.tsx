'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";

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
  const [data, setData] = useState<Details>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/teachers/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) setData({ ...EMPTY, ...d });
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const set = (key: keyof Details) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((d) => ({ ...d, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/teachers/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save");

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
    opts: { required?: boolean; type?: string; placeholder?: string; readOnly?: boolean; hint?: string } = {},
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
        className={opts.readOnly ? "bg-muted/50 text-muted-foreground" : ""}
      />
      {opts.hint && <p className="text-xs text-muted-foreground">{opts.hint}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {field("fullName", "Full name", { required: true, placeholder: "Jane Amara Perera" })}
        {field("nameWithInitials", "Name with initials", { required: true, placeholder: "J. A. Perera" })}
        {field("contactNumber", "Primary contact number", { required: true, type: "tel", placeholder: "+94 77 123 4567" })}
        {field("contactNumber2", "Secondary contact number", { type: "tel", placeholder: "+94 11 234 5678" })}
      </div>

      {field("email", "Email", { readOnly: true, hint: "Linked to your account. Verify it from the Email verification section." })}

      {field("address", "Address", { required: true, placeholder: "123 Main Street, Colombo" })}

      <div className="grid gap-5 sm:grid-cols-2">
        {field("country", "Country", { required: true, placeholder: "Sri Lanka" })}
        {field("postalCode", "Postal code", { required: true, placeholder: "00100" })}
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
