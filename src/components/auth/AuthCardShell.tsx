'use client';

import Link from "next/link";
import { GraduationCap } from "lucide-react";

/** Centered single-column layout for the smaller auth screens (password reset). */
const AuthCardShell = ({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col justify-center bg-background px-6 py-12">
    <div className="mx-auto w-full max-w-md">
      <Link href="/" className="mb-10 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-hero shadow-soft">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">MiniUni</span>
      </Link>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  </div>
);

export default AuthCardShell;
