'use client';

import Link from "next/link";
import { GraduationCap } from "lucide-react";

/** Centered single-column layout for the smaller auth screens (password reset). */
const AuthCardShell = ({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) => (
  <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-background px-6 py-12 grain">
    <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-primary/[0.08] blur-3xl" />
    <div className="pointer-events-none absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-accent/[0.06] blur-3xl" />
    <div className="mx-auto w-full max-w-md">
      <Link href="/" className="relative mb-10 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-hero shadow-soft">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">MiniUni</span>
      </Link>
      <div className="relative mb-8">
        <h1 className="type-page-title mb-2">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="relative rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-elevated backdrop-blur-xl sm:p-8">
        {children}
      </div>
    </div>
  </div>
);

export default AuthCardShell;
