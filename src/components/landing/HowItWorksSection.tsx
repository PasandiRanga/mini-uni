import { Search, MessageSquare, CreditCard, Video } from "lucide-react";
import Reveal from "@/components/Reveal";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Post or browse",
    description: "Share what you want to learn, or browse teachers and their open class slots.",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Connect & discuss",
    description: "Send an inquiry, talk through your goals, and agree on a time that works.",
  },
  {
    number: "03",
    icon: CreditCard,
    title: "Book & pay securely",
    description: "Pick your slot and pay. The money waits in escrow until the class is complete.",
  },
  {
    number: "04",
    icon: Video,
    title: "Learn & confirm",
    description: "Join the auto-generated meeting, learn, and confirm completion to release payment.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="relative overflow-hidden py-28 grain">
      <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4">
        <Reveal className="mb-20 max-w-2xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">The process</p>
          <h2 className="text-4xl sm:text-5xl font-semibold leading-tight">
            Four steps from curiosity
            <span className="font-serif italic font-normal text-gradient"> to class.</span>
          </h2>
        </Reveal>

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.12} className="group relative">
              <div className="mb-7 flex items-baseline gap-3">
                <span className="font-serif text-6xl italic leading-none text-foreground/[0.12] transition-colors duration-500 group-hover:text-accent/60">
                  {step.number}
                </span>
                <step.icon className="h-5 w-5 translate-y-[-4px] text-primary" strokeWidth={1.75} />
              </div>
              <div className="mb-5 h-px w-full origin-left bg-border transition-colors duration-500 group-hover:bg-accent/50" />
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
