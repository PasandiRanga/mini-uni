'use client';

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CURRENCIES, currencyLabel, type CurrencyCode } from "@/lib/currency";
import { Loader2, Check } from "lucide-react";

/**
 * Account currency selector. Saving persists to the user and reloads so every
 * money display picks up the new currency. Existing balances are NOT converted.
 */
export const CurrencySettings = () => {
  const { toast } = useToast();
  const [selected, setSelected] = useState<CurrencyCode | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/currency")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSelected(d.currency))
      .catch(() => {});
  }, []);

  const save = async (currency: CurrencyCode) => {
    if (currency === selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/auth/currency", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setSelected(currency);
      toast({ title: "Currency updated", description: "Refreshing amounts…" });
      // Reload so every cached money display re-formats with the new currency.
      setTimeout(() => window.location.reload(), 700);
    } catch (err: unknown) {
      toast({ title: "Couldn't update", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {CURRENCIES.map((code) => {
          const active = selected === code;
          return (
            <button
              key={code}
              type="button"
              disabled={saving}
              onClick={() => save(code)}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 disabled:opacity-60 ${active
                ? "border-primary bg-primary/[0.06]"
                : "border-border/70 hover:border-foreground/30 hover:bg-muted/50"
                }`}
            >
              <div>
                <p className="text-sm font-medium">{code}</p>
                <p className="text-xs text-muted-foreground">{currencyLabel(code)}</p>
              </div>
              {active && (saving ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Check className="h-4 w-4 text-primary" />)}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        This sets how amounts are shown and the currency used for new classes and payments. Existing
        balances are not converted.
      </p>
    </div>
  );
};

export default CurrencySettings;
