import { Button } from "@/components/ui/button";

/** The multi-colour Google "G", so the button reads as official Google sign-in. */
export const GoogleGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path fill="#4285F4" d="M23.52 12.27c0-.82-.07-1.6-.2-2.36H12v4.46h6.47a5.53 5.53 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.75z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.12A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.61H1.28a12 12 0 0 0 0 10.78l3.99-3.12z" />
    <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.28 6.61l3.99 3.12C6.22 6.88 8.87 4.77 12 4.77z" />
  </svg>
);

/** "Continue with Google" — starts the server-side OAuth sign-in flow. */
export const GoogleButton = ({ label = "Continue with Google" }: { label?: string }) => (
  <Button asChild variant="outline" size="lg" className="w-full gap-3">
    <a href="/api/auth/google/start">
      <GoogleGlyph />
      {label}
    </a>
  </Button>
);
