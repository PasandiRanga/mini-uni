'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MailWarning, CheckCircle2, X, ArrowRight } from "lucide-react";

interface EmailVerificationBannerProps {
  /**
   * "banner" (default): dismissible strip that hides once verified.
   * "card": persistent settings card that can't be dismissed and shows a
   * confirmation row when the email is already verified.
   */
  variant?: "banner" | "card";
}

/**
 * Prompts an unverified user to verify their email. The actual code entry
 * happens on the dedicated /verify-email page — this component only surfaces
 * the prompt and links there. Fetches its own status from /api/auth/me, so it
 * can be dropped in anywhere without prop wiring.
 */
const EmailVerificationBanner = ({ variant = "banner" }: EmailVerificationBannerProps) => {
  const [verified, setVerified] = useState<boolean | null>(null); // null = still loading
  const [dismissed, setDismissed] = useState(false);
  const isCard = variant === "card";

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (active && u) setVerified(Boolean(u.emailVerified));
      })
      .catch(() => {
        /* leave as loading/hidden on error */
      });
    return () => {
      active = false;
    };
  }, []);

  // Still loading status — render nothing yet.
  if (verified === null) return null;

  // Verified: banner disappears entirely; the settings card shows a confirmation row.
  if (verified === true) {
    if (!isCard) return null;
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-success/40 bg-success/[0.08] px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Email verified</p>
          <p className="text-xs text-muted-foreground">Your email address has been confirmed.</p>
        </div>
      </div>
    );
  }

  // Banner variant can be dismissed for the session; card variant cannot.
  if (!isCard && dismissed) return null;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-warning/40 bg-warning/[0.08] px-5 py-4 grain ${isCard ? "" : "mb-6"}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
          <MailWarning className="h-5 w-5" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Verify your email</p>
          <p className="text-xs text-muted-foreground">
            Confirm your email address to secure your account and unlock all features.
          </p>
        </div>

        <Button variant="hero" size="sm" className="gap-2" asChild>
          <Link href="/verify-email">
            Verify email
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        {!isCard && (
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Dismiss"
            title="Dismiss for now"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
