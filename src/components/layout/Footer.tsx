import { Link } from "react-router-dom";
import { GraduationCap, Twitter, Instagram, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-background">ClassConnect</span>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed">
              Connecting passionate teachers with eager students. Learn anything, anytime, anywhere.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="#" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* For Students */}
          <div>
            <h4 className="font-semibold mb-4 text-background">For Students</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/feed" className="text-background/70 hover:text-background transition-colors">Find Teachers</Link></li>
              <li><Link to="/how-it-works" className="text-background/70 hover:text-background transition-colors">How It Works</Link></li>
              <li><Link to="/subjects" className="text-background/70 hover:text-background transition-colors">Browse Subjects</Link></li>
              <li><Link to="/pricing" className="text-background/70 hover:text-background transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* For Teachers */}
          <div>
            <h4 className="font-semibold mb-4 text-background">For Teachers</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/for-teachers" className="text-background/70 hover:text-background transition-colors">Start Teaching</Link></li>
              <li><Link to="/verification" className="text-background/70 hover:text-background transition-colors">Verification Process</Link></li>
              <li><Link to="/teacher-resources" className="text-background/70 hover:text-background transition-colors">Resources</Link></li>
              <li><Link to="/success-stories" className="text-background/70 hover:text-background transition-colors">Success Stories</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-background">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/help" className="text-background/70 hover:text-background transition-colors">Help Center</Link></li>
              <li><Link to="/contact" className="text-background/70 hover:text-background transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="text-background/70 hover:text-background transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-background/70 hover:text-background transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center text-sm text-background/60">
          <p>© 2024 ClassConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
