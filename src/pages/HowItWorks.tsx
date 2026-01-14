import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Check, BookOpen, Users, ShieldCheck, CreditCard, Star } from "lucide-react";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Check className="w-4 h-4" />
              The MiniUni Guide
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">How MiniUni Works</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">Step-by-step flows for students and teachers — from discovery to verified teaching, secure bookings, and completed classes.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <Card className="p-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Students</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground mt-3">
                  <li>Create an account and complete your profile.</li>
                  <li>Use Explore to browse teacher offerings or post a request.</li>
                  <li>Apply filters to find the right subject, level, price and availability.</li>
                  <li>Contact teachers, book a class, and pay securely through MiniUni.</li>
                  <li>Attend the session and leave ratings to help others.</li>
                </ol>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <CardTitle className="text-lg">Teachers</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground mt-3">
                  <li>Register and complete your teaching profile with subjects, grades and sample rates.</li>
                  <li>Submit verification documents if required to earn the Verified badge.</li>
                  <li>Create public offerings and manage availability.</li>
                  <li>Accept bookings, teach online or in-person, and receive payments securely.</li>
                  <li>Encourage reviews to grow your reputation.</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl p-5 text-center">
              <ShieldCheck className="mx-auto w-6 h-6 text-success mb-2" />
              <h3 className="font-semibold">Verification</h3>
              <p className="text-sm text-muted-foreground mt-2">Teachers may verify identity & credentials. Verified teachers get a badge.</p>
            </div>

            <div className="bg-card rounded-xl p-5 text-center">
              <CreditCard className="mx-auto w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold">Payments & Booking</h3>
              <p className="text-sm text-muted-foreground mt-2">Secure payments, receipts, and booking management in your dashboard.</p>
            </div>

            <div className="bg-card rounded-xl p-5 text-center">
              <Star className="mx-auto w-6 h-6 text-warning mb-2" />
              <h3 className="font-semibold">Ratings</h3>
              <p className="text-sm text-muted-foreground mt-2">Students rate teachers after classes — ratings improve discoverability.</p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto text-center mt-10">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild variant="hero"><Link to="/signup">Get Started</Link></Button>
              <Button asChild variant="outline"><Link to="/feed">Explore Posts</Link></Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
