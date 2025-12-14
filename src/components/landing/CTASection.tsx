import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Users } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Students CTA */}
          <div className="relative bg-card rounded-3xl p-8 lg:p-12 shadow-elevated overflow-hidden group hover:shadow-glow transition-all duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-0 group-hover:bg-primary/20 transition-colors" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <GraduationCap className="w-7 h-7 text-primary" />
              </div>
              
              <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                Ready to start 
                <span className="font-serif italic text-gradient"> learning?</span>
              </h3>
              
              <p className="text-muted-foreground mb-8 max-w-md">
                Join thousands of students finding their perfect teachers. Post what you want to learn and get matched instantly.
              </p>
              
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth?mode=signup&role=student">
                  Find a Teacher
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Teachers CTA */}
          <div className="relative bg-foreground rounded-3xl p-8 lg:p-12 shadow-elevated overflow-hidden group hover:shadow-glow transition-all duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -z-0 group-hover:bg-secondary/30 transition-colors" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-secondary" />
              </div>
              
              <h3 className="text-2xl lg:text-3xl font-bold mb-4 text-background">
                Share your 
                <span className="font-serif italic"> expertise</span>
              </h3>
              
              <p className="text-background/70 mb-8 max-w-md">
                Turn your knowledge into income. Set your own rates, create your schedule, and teach students from anywhere.
              </p>
              
              <Button variant="warm" size="lg" asChild>
                <Link to="/auth?mode=signup&role=teacher">
                  Start Teaching
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
