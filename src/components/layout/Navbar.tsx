import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, GraduationCap, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/');
  };

  const getDashboardPath = () => user?.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? (getDashboardPath()) : "/"} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-soft group-hover:shadow-card transition-shadow">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MiniUni</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!isAuthenticated ? (
              // Guest nav: Home, Explore, How It Works
              <>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Home
                </Link>
                <Link to="/feed" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Explore
                </Link>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  How It Works
                </Link>
              </>
            ) : (
              // Authenticated nav: Explore, Find Teachers, Create Post
              <>
                <Link to="/feed" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Explore
                </Link>
                <Link to="/teachers" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Find Teachers
                </Link>
                {user?.role === 'STUDENT' && (
                  <Link to="/post/create" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                    Post Request
                  </Link>
                )}
                {user?.role === 'TEACHER' && (
                  <Link to="/post/create" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                    Create Offering
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user?.firstName}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
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
            {!isAuthenticated ? (
              // Guest mobile nav
              <>
                <Link 
                  to="/" 
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors font-medium" 
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  to="/feed" 
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors font-medium" 
                  onClick={() => setIsOpen(false)}
                >
                  Explore
                </Link>
                <Link 
                  to="/how-it-works" 
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors font-medium" 
                  onClick={() => setIsOpen(false)}
                >
                  How It Works
                </Link>
              </>
            ) : (
              // Authenticated mobile nav
              <>
                <Link 
                  to="/feed" 
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors font-medium" 
                  onClick={() => setIsOpen(false)}
                >
                  Explore
                </Link>
                <Link 
                  to="/teachers" 
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors font-medium" 
                  onClick={() => setIsOpen(false)}
                >
                  Find Teachers
                </Link>
                {user?.role === 'STUDENT' && (
                  <Link 
                    to="/post/create" 
                    className="block py-2 text-muted-foreground hover:text-foreground transition-colors font-medium" 
                    onClick={() => setIsOpen(false)}
                  >
                    Post Request
                  </Link>
                )}
                {user?.role === 'TEACHER' && (
                  <Link 
                    to="/post/create" 
                    className="block py-2 text-muted-foreground hover:text-foreground transition-colors font-medium" 
                    onClick={() => setIsOpen(false)}
                  >
                    Create Offering
                  </Link>
                )}
              </>
            )}
            
            {/* Mobile auth buttons */}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground py-2">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>Log in</Link>
                  </Button>
                  <Button variant="hero" className="w-full" asChild>
                    <Link to="/signup" onClick={() => setIsOpen(false)}>Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
