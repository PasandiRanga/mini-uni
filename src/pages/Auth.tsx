import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Mail, Lock, User, ArrowRight, Eye, EyeOff, BookOpen, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "login" | "signup";
type UserRole = "student" | "teacher";

type Teacher = {
  id: string;
  firstName?: string;
  lastName?: string;
  verified?: boolean;
};

const Auth = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [mode] = useState<AuthMode>((searchParams?.get("mode") as AuthMode) || "login");
  const [role] = useState<UserRole>((searchParams?.get("role") as UserRole) || "student");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        // Attempt real login via Auth context
        await login(formData.email, formData.password, role.toUpperCase());
        toast({ title: "Welcome back!", description: "Redirecting to your dashboard..." });
        router.push(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: 'Error', description: message || 'Authentication failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Teachers list for informational display on the auth page
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch(`/api/teachers`);
        if (res.ok) {
          const data = await res.json();
          setTeachers(data || []);
        }
      } catch (e) {
        // non-fatal for auth page
        console.error('Failed to fetch teachers', e);
      }
    };
    fetchTeachers();
  }, []);

  const verifiedCount = teachers.filter((t) => t.verified).length;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">MiniUni</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "login"
                ? "Enter your credentials to access your account"
                : "Start your journey with MiniUni today"}
            </p>
          </div>

          {/* Signup role selection removed - all signups handled on the /signup page */}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Inline signup name field removed. Use /signup for new accounts. */}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-12"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              variant={role === "teacher" ? "warm" : "hero"}
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-pulse">Please wait...</span>
              ) : (
                <>
                  {mode === "login" ? "Sign in" : "Create account"}
                  <ArrowRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>
          </form>

          {/* Signup handled on dedicated /signup page */}
          <p className="mt-8 text-center text-muted-foreground">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <div className="max-w-lg text-primary-foreground text-center">
          <h2 className="text-3xl font-bold mb-4">
            {role === "teacher"
              ? "Share your knowledge with the world"
              : "Find your perfect teacher today"}
          </h2>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            {role === "teacher"
              ? "Join our community of verified educators. Set your own schedule, rates, and reach students who are eager to learn from you."
              : "Access a network of verified teachers across dozens of subjects. Learn at your own pace with personalized one-on-one sessions."}
          </p>

          <div className="grid grid-cols-3 gap-6 mt-12">
            <div className="bg-primary-foreground/10 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-3xl font-bold">2.5K+</p>
              <p className="text-sm text-primary-foreground/80">Active Students</p>
            </div>
            <div className="bg-primary-foreground/10 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-3xl font-bold">{verifiedCount > 0 ? verifiedCount : '—'}</p>
              <p className="text-sm text-primary-foreground/80">Verified Teachers</p>
            </div>
            <div className="bg-primary-foreground/10 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-3xl font-bold">50+</p>
              <p className="text-sm text-primary-foreground/80">Subjects</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
