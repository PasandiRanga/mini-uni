import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Star, ShieldCheck, CalendarDays } from "lucide-react";

const subjects = [
  "Mathematics", "Physics", "Chemistry", "Music Theory", "Literature",
  "Programming", "Economics", "Biology", "Languages", "Art & Design",
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-24 overflow-hidden grain">
      {/* Background washes */}
      <div className="absolute -top-40 right-[-10%] w-[640px] h-[640px] rounded-full bg-primary/[0.06] blur-3xl -z-10" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[520px] h-[520px] rounded-full bg-secondary/[0.07] blur-3xl -z-10" />

      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left — editorial display type */}
          <div className="lg:col-span-7 space-y-9">
            <div className="animate-fade-up inline-flex items-center gap-2.5 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
              A quieter way to learn
            </div>

            <h1 className="animate-fade-up text-5xl sm:text-6xl lg:text-[5.25rem] leading-[1.02] font-semibold" style={{ animationDelay: "0.1s" }}>
              Every subject has
              <br />
              <span className="font-serif italic font-normal text-gradient">its teacher.</span>
            </h1>

            <p className="animate-fade-up max-w-lg text-lg leading-relaxed text-muted-foreground" style={{ animationDelay: "0.2s" }}>
              MiniUni pairs curious students with verified, hand-reviewed teachers.
              Book a live class in minutes — payments held safely until the lesson is done.
            </p>

            <div className="animate-fade-up flex flex-wrap items-center gap-4" style={{ animationDelay: "0.3s" }}>
              <Button variant="hero" size="xl" asChild>
                <Link href="/signup">
                  Find your teacher
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link href="/signup">
                  Teach on MiniUni
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            <div className="animate-fade-up flex items-center gap-6 pt-2" style={{ animationDelay: "0.4s" }}>
              <div className="flex -space-x-2.5">
                {["A", "M", "K", "S", "J"].map((initial, i) => (
                  <div
                    key={initial}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-muted text-[11px] font-semibold text-foreground/70"
                    style={{ zIndex: 5 - i }}
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  4.9 <Star className="h-3.5 w-3.5 fill-accent text-accent" /> average rating
                </span>
                from 2,500+ students
              </div>
            </div>
          </div>

          {/* Right — layered class cards */}
          <div className="lg:col-span-5 relative hidden lg:block">
            <div className="animate-fade-up relative" style={{ animationDelay: "0.35s" }}>
              {/* Main teacher card */}
              <div className="relative z-20 rounded-3xl border border-border/70 bg-card p-7 shadow-elevated">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-hero font-serif text-2xl italic text-primary-foreground">
                      S
                    </div>
                    <div>
                      <p className="font-semibold">Sarah Mitchell</p>
                      <p className="text-xs text-muted-foreground">Mathematics · Physics</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-success">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                </div>
                <div className="mt-6 flex items-end justify-between border-t border-border/60 pt-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Next available</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                      <CalendarDays className="h-4 w-4 text-primary" /> Tomorrow, 4:00 PM
                    </p>
                  </div>
                  <p className="font-serif text-3xl italic">
                    $40<span className="text-sm not-italic font-sans text-muted-foreground">/hr</span>
                  </p>
                </div>
              </div>

              {/* Student request card, offset */}
              <div className="relative z-10 -mt-7 ml-12 rounded-3xl border border-border/60 bg-muted/70 p-6 backdrop-blur-sm shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Grade 11 — Organic Chemistry</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Student request · 2h ago</p>
                  </div>
                  <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                    Open
                  </span>
                </div>
              </div>

              {/* Floating booked chip */}
              <div className="animate-float absolute -bottom-9 right-2 z-30 rounded-2xl border border-border/70 bg-card px-5 py-3.5 shadow-card">
                <p className="text-sm font-semibold">Class booked ✓</p>
                <p className="text-[11px] text-muted-foreground">Payment held in escrow</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject marquee */}
      <div className="relative border-y border-border/60 bg-card/50 py-4 backdrop-blur-sm">
        <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
          {[...subjects, ...subjects].map((subject, i) => (
            <span key={i} className="flex items-center gap-10 text-sm tracking-wide text-muted-foreground">
              <span className="font-serif text-base italic">{subject}</span>
              <span className="h-1 w-1 rounded-full bg-accent" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
