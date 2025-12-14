import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, GraduationCap, BookOpen } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-soft group-hover:shadow-card transition-shadow">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">ClassConnect</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/feed" 
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Explore
            </Link>
            <Link 
              to="/how-it-works" 
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              How It Works
            </Link>
            <Link 
              to="/for-teachers" 
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              For Teachers
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Log in</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/auth?mode=signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-card border-b border-border animate-fade-in">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <Link 
              to="/feed" 
              className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Explore
            </Link>
            <Link 
              to="/how-it-works" 
              className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              How It Works
            </Link>
            <Link 
              to="/for-teachers" 
              className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              For Teachers
            </Link>
            <div className="pt-3 flex flex-col gap-2">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/auth" onClick={() => setIsOpen(false)}>Log in</Link>
              </Button>
              <Button variant="hero" className="w-full" asChild>
                <Link to="/auth?mode=signup" onClick={() => setIsOpen(false)}>Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
