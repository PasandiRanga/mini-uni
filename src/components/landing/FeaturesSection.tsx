import { Shield, Calendar, Video, Wallet, MapPin, MessageCircle } from "lucide-react";
import Reveal from "@/components/Reveal";

const features = [
  {
    icon: Shield,
    title: "Verified teachers",
    description: "Every teacher passes ID and qualification review before their first class. No exceptions.",
  },
  {
    icon: Calendar,
    title: "Effortless scheduling",
    description: "Browse real availability, pick a slot, and get instant confirmation — no back-and-forth.",
  },
  {
    icon: Video,
    title: "Live video classes",
    description: "A Google Meet link is generated for every booking. Click, join, learn.",
  },
  {
    icon: Wallet,
    title: "Escrow payments",
    description: "Your payment is held safely and released only when both sides confirm the class happened.",
  },
  {
    icon: MapPin,
    title: "Local or worldwide",
    description: "Meet teachers near you in person, or connect online with experts anywhere.",
  },
  {
    icon: MessageCircle,
    title: "Direct conversation",
    description: "Discuss goals and expectations with teachers before you ever spend a cent.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="relative py-28">
      <div className="container mx-auto px-4">
        <Reveal className="mx-auto mb-20 max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Why MiniUni</p>
          <h2 className="text-4xl sm:text-5xl font-semibold leading-tight">
            Built for learning,
            <span className="font-serif italic font-normal text-gradient"> not friction.</span>
          </h2>
        </Reveal>

        <div className="grid gap-px overflow-hidden rounded-3xl border border-border/70 bg-border/50 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal
              key={feature.title}
              delay={index * 0.08}
              className="group relative bg-card p-9 transition-colors duration-300 hover:bg-muted/60"
            >
              <span className="absolute right-7 top-7 font-serif text-xl italic text-muted-foreground/40 transition-colors group-hover:text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <feature.icon className="mb-6 h-6 w-6 text-primary transition-transform duration-300 group-hover:-translate-y-1" strokeWidth={1.75} />
              <h3 className="mb-2.5 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
