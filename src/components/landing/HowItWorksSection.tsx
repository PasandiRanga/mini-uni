import { Search, MessageSquare, CreditCard, Video, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Post or Browse",
    description: "Post what you want to learn or browse through teacher profiles and available classes."
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Connect & Discuss",
    description: "Send inquiries, discuss your learning goals, and find the perfect match for your needs."
  },
  {
    number: "03",
    icon: CreditCard,
    title: "Book & Pay",
    description: "Choose a time slot, pay securely. Your payment is held safely until class completion."
  },
  {
    number: "04",
    icon: Video,
    title: "Learn & Grow",
    description: "Join via the auto-generated meeting link, learn, and confirm completion to release payment."
  }
];

const HowItWorksSection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How MiniUni 
            <span className="font-serif italic text-gradient"> works</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From finding the right teacher to completing your class—simple, secure, and seamless.
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-24 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary via-accent to-secondary opacity-20" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="relative text-center group"
              >
                {/* Number badge */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-hero text-primary-foreground font-bold text-xl mb-6 shadow-elevated group-hover:scale-110 transition-transform relative z-10">
                  {step.number}
                </div>
                
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
