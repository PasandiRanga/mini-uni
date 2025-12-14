import { Shield, Calendar, Video, Wallet, MapPin, MessageCircle, Clock, Star } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Teachers",
    description: "Every teacher goes through ID and qualification verification before teaching on our platform.",
    color: "primary"
  },
  {
    icon: Calendar,
    title: "Easy Scheduling",
    description: "Browse available time slots, request your preferred time, and get instant confirmations.",
    color: "accent"
  },
  {
    icon: Video,
    title: "Video Classes",
    description: "Auto-generated Google Meet links for seamless online learning experiences.",
    color: "secondary"
  },
  {
    icon: Wallet,
    title: "Secure Payments",
    description: "Escrow-based payments. Funds released only after both parties confirm class completion.",
    color: "success"
  },
  {
    icon: MapPin,
    title: "Location-Based",
    description: "Find teachers near you for in-person classes or connect online with anyone worldwide.",
    color: "warning"
  },
  {
    icon: MessageCircle,
    title: "Direct Messaging",
    description: "Chat directly with teachers to discuss requirements before booking.",
    color: "primary"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need for 
            <span className="font-serif italic text-gradient"> seamless learning</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A complete platform designed to make finding and booking classes as simple as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 text-${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
