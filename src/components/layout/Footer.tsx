import Link from "next/link";
import { GraduationCap, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-foreground py-20 text-background grain">
      <div className="absolute -top-32 left-1/3 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

      <div className="container relative mx-auto px-4">
        {/* Oversized wordmark */}
        <div className="mb-16 border-b border-background/10 pb-12">
          <p className="font-serif text-5xl italic leading-tight text-background/90 sm:text-6xl lg:text-7xl">
            Learn anything.
            <span className="text-background/40"> Teach everything.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-hero">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-background">
                Mini<span className="font-serif italic font-normal">Uni</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-background/60">
              Connecting passionate teachers with eager students. Learn anything, anytime, anywhere.
            </p>
            <div className="mt-6 flex gap-3">
              {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-background/15 transition-all duration-300 hover:border-background/40 hover:bg-background/10 hover:-translate-y-0.5"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* For Students */}
          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-background/50">For Students</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/feed" className="link-underline text-background/70 transition-colors hover:text-background">Find Teachers</Link></li>
              <li><Link href="/how-it-works" className="link-underline text-background/70 transition-colors hover:text-background">How It Works</Link></li>
              <li><Link href="/subjects" className="link-underline text-background/70 transition-colors hover:text-background">Browse Subjects</Link></li>
              <li><Link href="/pricing" className="link-underline text-background/70 transition-colors hover:text-background">Pricing</Link></li>
            </ul>
          </div>

          {/* For Teachers */}
          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-background/50">For Teachers</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/for-teachers" className="link-underline text-background/70 transition-colors hover:text-background">Start Teaching</Link></li>
              <li><Link href="/verification" className="link-underline text-background/70 transition-colors hover:text-background">Verification Process</Link></li>
              <li><Link href="/teacher-resources" className="link-underline text-background/70 transition-colors hover:text-background">Resources</Link></li>
              <li><Link href="/success-stories" className="link-underline text-background/70 transition-colors hover:text-background">Success Stories</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-background/50">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/help" className="link-underline text-background/70 transition-colors hover:text-background">Help Center</Link></li>
              <li><Link href="/contact" className="link-underline text-background/70 transition-colors hover:text-background">Contact Us</Link></li>
              <li><Link href="/privacy" className="link-underline text-background/70 transition-colors hover:text-background">Privacy Policy</Link></li>
              <li><Link href="/terms" className="link-underline text-background/70 transition-colors hover:text-background">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-background/10 pt-8 text-sm text-background/50 sm:flex-row">
          <p>© {new Date().getFullYear()} MiniUni. All rights reserved.</p>
          <p className="font-serif italic">Every subject has its teacher.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
