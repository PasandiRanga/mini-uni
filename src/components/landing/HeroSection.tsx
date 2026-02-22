import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Sparkles, Users, BookOpen, Star } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>The future of personalized learning</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Teach. Learn.
              <span className="font-serif italic text-gradient"> Connect </span>
              Anywhere.
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              A secure, verified platform for online learning. Students discover elite teachers and book live classes instantly.
              Teachers create offerings, connect with students, and grow their teaching business securely.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup">
                  Find a Teacher
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/signup">
                  Start Teaching
                  <Sparkles className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-8 pt-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-medium"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">2,500+</span> happy students
                </p>
              </div>
            </div>
          </div>

          {/* Right content - Hero visual */}
          <div className="relative lg:pl-8" style={{ animationDelay: '0.2s' }}>
            <div className="relative animate-fade-up space-y-6" style={{ animationDelay: '0.3s' }}>
              {/* Teacher Card */}
              <div className="bg-card rounded-3xl shadow-elevated p-6 border border-border/50 relative z-20">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center text-xl font-serif italic text-primary-foreground">
                    S
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base">Sarah Mitchell</h3>
                      <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-medium uppercase">Verified Teacher</span>
                    </div>
                    <p className="text-muted-foreground text-xs">Mathematics & Physics Specialist</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex italic text-warning translate-y-[1px]">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <span className="text-[11px] text-muted-foreground">4.9 (127 reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Request Card (Overlapping) */}
              <div className="bg-muted/80 backdrop-blur-sm rounded-3xl p-6 border border-border/50 relative z-10 -mt-8 ml-8 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-xl text-secondary">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base">Chemistry Help</h3>
                      <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-medium uppercase">Student Request</span>
                    </div>
                    <p className="text-muted-foreground text-xs">Looking for Grade 11 Organic Chemistry tutor</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs font-semibold text-foreground">$35-45/hr</div>
                      <div className="text-[10px] text-muted-foreground">Posted 2h ago</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="absolute -bottom-6 right-0 bg-card rounded-2xl shadow-card p-4 border border-border animate-float z-30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Verified Community</p>
                    <p className="text-[11px] text-muted-foreground">Secure Payments & Booking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
