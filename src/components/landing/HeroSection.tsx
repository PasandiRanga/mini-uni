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
              Connect with 
              <span className="font-serif italic text-gradient"> verified teachers </span>
              in your area
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Post what you want to learn, find the perfect teacher, and book classes instantly. 
              Our secure platform handles payments, scheduling, and video calls.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup">
                  Start Learning
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
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
            <div className="relative animate-fade-up" style={{ animationDelay: '0.3s' }}>
              {/* Main card */}
              <div className="bg-card rounded-3xl shadow-elevated p-6 space-y-6">
                {/* Teacher profile preview */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center text-2xl font-serif italic text-primary-foreground">
                    S
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">Sarah Mitchell</h3>
                      <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">Verified</span>
                    </div>
                    <p className="text-muted-foreground text-sm">Mathematics & Physics Teacher</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">4.9 (127 reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">8+</p>
                    <p className="text-xs text-muted-foreground">Years Exp.</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">250+</p>
                    <p className="text-xs text-muted-foreground">Classes</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">$45</p>
                    <p className="text-xs text-muted-foreground">/hour</p>
                  </div>
                </div>

                <Button variant="hero" className="w-full" size="lg">
                  Book a Class
                </Button>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-card rounded-2xl shadow-card p-4 animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">500+</p>
                    <p className="text-xs text-muted-foreground">Active Teachers</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-card p-4 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">50+</p>
                    <p className="text-xs text-muted-foreground">Subjects</p>
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
