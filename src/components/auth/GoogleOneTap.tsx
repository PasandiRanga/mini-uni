'use client';
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

const GIS_SRC = "https://accounts.google.com/gsi/client";

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(s);
  });

/**
 * Google One Tap: shows Google's own "Continue as <name>" prompt to logged-out
 * visitors who are signed in to Google. On selection, Google hands us a signed
 * ID token which the backend verifies and turns into a MiniUni session (or the
 * role-picker for a brand-new account). Renders nothing itself.
 */
const GoogleOneTap = () => {
  const { user, isLoading } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (isLoading || user || started.current) return; // only for logged-out visitors, once
    started.current = true;
    let cancelled = false;

    (async () => {
      try {
        const cfg = await fetch("/api/auth/google/onetap").then((r) => r.json());
        if (cancelled || !cfg?.clientId) return;
        await loadScript(GIS_SRC);
        const g = (window as unknown as { google?: any }).google;
        if (cancelled || !g?.accounts?.id) return;

        g.accounts.id.initialize({
          client_id: cfg.clientId,
          use_fedcm_for_prompt: true,
          auto_select: false,
          cancel_on_tap_outside: false,
          callback: async (resp: { credential?: string }) => {
            if (!resp?.credential) return;
            try {
              const r = await fetch("/api/auth/google/onetap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: resp.credential }),
              });
              const data = await r.json();
              if (r.ok && data?.redirect) window.location.href = data.redirect;
            } catch {
              /* non-fatal: the explicit "Continue with Google" button still works */
            }
          },
        });
        g.accounts.id.prompt();
      } catch {
        /* One Tap is a convenience; never block the page on it */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isLoading]);

  return null;
};

export default GoogleOneTap;
