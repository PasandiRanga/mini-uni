import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, GraduationCap, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePostModal } from "@/contexts/CreatePostModalContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();
  const { openCreatePost } = useCreatePostModal();

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push('/');
  };

  const getDashboardPath = () => user?.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/75 backdrop-blur-xl border-b border-border/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isAuthenticated ? (getDashboardPath()) : "/"} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full gradient-hero flex items-center justify-center shadow-soft transition-all duration-300 group-hover:shadow-card group-hover:rotate-[8deg]">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              Mini<span className="font-serif italic font-normal">Uni</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!isAuthenticated ? (
              // Guest nav: Home, Explore, How It Works
              <>
                <Link href="/" className="link-underline text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Home
                </Link>
                <Link href="/explore" className="link-underline text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Explore
                </Link>
                <Link href="/how-it-works" className="link-underline text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                  How It Works
                </Link>
              </>
            ) : (
              // Authenticated nav: Explore, Find Teachers, Create Post
              <>
                <Link href="/explore" className="link-underline text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Explore
                </Link>
                {user?.role === 'STUDENT' && (
                  <Link href="/teachers" className="link-underline text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                    Find Teachers
                  </Link>
                )}
                {user?.role === 'STUDENT' && (
                  <button type="button" onClick={() => openCreatePost()} className="link-underline text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                    Post Request
                  </button>
                )}
                {user?.role === 'TEACHER' && (
                  <button type="button" onClick={() => openCreatePost()} className="link-underline text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                    Create Post
                  </button>
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
                  <Link href="/auth">Log in</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link href="/signup">Get Started</Link>
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
                  href="/"
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/explore"
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Explore
                </Link>
                <Link
                  href="/how-it-works"
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
                  href="/explore"
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Explore
                </Link>
                {user?.role === 'STUDENT' && (
                  <Link
                    href="/teachers"
                    className="block py-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Find Teachers
                  </Link>
                )}
                {user?.role === 'STUDENT' && (
                  <button
                    type="button"
                    className="block w-full text-left py-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                    onClick={() => { setIsOpen(false); openCreatePost(); }}
                  >
                    Post Request
                  </button>
                )}
                {user?.role === 'TEACHER' && (
                  <button
                    type="button"
                    className="block w-full text-left py-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                    onClick={() => { setIsOpen(false); openCreatePost(); }}
                  >
                    Create Offering
                  </button>
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
                    <Link href="/auth" onClick={() => setIsOpen(false)}>Log in</Link>
                  </Button>
                  <Button variant="hero" className="w-full" asChild>
                    <Link href="/signup" onClick={() => setIsOpen(false)}>Get Started</Link>
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
