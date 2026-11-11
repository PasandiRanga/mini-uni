'use client';

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ReactNode } from "react";

/** Shared shell for the Privacy and Terms pages: navbar, a titled header, a readable measure, footer. */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-medium text-muted-foreground">Last updated {updated}</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{intro}</p>

            <div className="mt-12 space-y-10">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/** A numbered section with a heading and body. */
export function LegalSection({ id, heading, children }: { id: string; heading: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_strong]:text-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}
