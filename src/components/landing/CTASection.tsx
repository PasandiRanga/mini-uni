import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Reveal from "@/components/Reveal";

const CTASection = () => {
  return (
    <section className="py-28">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Students CTA — ivory card */}
          <Reveal className="group relative overflow-hidden rounded-[2rem] border border-border/70 bg-card p-10 lg:p-14 shadow-card transition-shadow duration-500 hover:shadow-elevated grain">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/[0.07] blur-3xl transition-all duration-700 group-hover:bg-primary/[0.12]" />

            <div className="relative z-10">
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-accent">For students</p>

              <h3 className="mb-5 text-3xl lg:text-4xl font-normal leading-tight">
                Ready to start
                <span className="font-serif italic text-gradient font-semibold"> learning?</span>
              </h3>

              <p className="mb-10 max-w-md leading-relaxed text-muted-foreground">
                Post what you want to learn and get matched with a verified teacher — often within hours.
              </p>

              <Button variant="hero" size="lg" asChild>
                <Link href="/signup">
                  Find a teacher
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </Reveal>

          {/* Teachers CTA — ink card */}
          <Reveal delay={0.12} className="group relative overflow-hidden rounded-[2rem] bg-foreground p-10 lg:p-14 shadow-elevated grain">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-secondary/20 blur-3xl transition-all duration-700 group-hover:bg-secondary/30" />

            <div className="relative z-10">
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-accent">For teachers</p>

              <h3 className="mb-5 text-3xl lg:text-4xl font-normal leading-tight text-background">
                Share your
                <span className="font-serif italic font-semibold"> expertise.</span>
              </h3>

              <p className="mb-10 max-w-md leading-relaxed text-background/70">
                Set your rates, design your schedule, and get paid securely for every class you teach.
              </p>

              <Button variant="warm" size="lg" asChild>
                <Link href="/signup">
                  Start teaching
                  <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
