'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, ArrowRight, GraduationCap } from "lucide-react";
import StudentSignUp from "@/components/auth/StudentSignUp";
import TeacherSignUp from "@/components/auth/TeacherSignUp";

type UserRole = "student" | "teacher" | null;

const SignUp = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const router = useRouter();

  if (selectedRole === "student") {
    return <StudentSignUp onBack={() => setSelectedRole(null)} />;
  }

  if (selectedRole === "teacher") {
    return <TeacherSignUp onBack={() => setSelectedRole(null)} />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">MiniUni</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Get Started</h1>
          <p className="text-muted-foreground">Choose your role to continue</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Student Option */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary" onClick={() => setSelectedRole("student")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">I want to learn</CardTitle>
              <CardDescription>
                Join as a student and find the perfect teacher for your learning journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  Quick and simple registration
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  Start learning immediately
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  Access to verified teachers
                </li>
              </ul>
              <Button variant="hero" className="w-full" onClick={() => setSelectedRole("student")}>
                Continue as Student
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Teacher Option */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-secondary" onClick={() => setSelectedRole("teacher")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle className="text-2xl">I want to teach</CardTitle>
              <CardDescription>
                Join as a teacher and share your knowledge with students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-secondary" />
                  Verification required
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-secondary" />
                  Set your own schedule
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-secondary" />
                  Secure payment system
                </li>
              </ul>
              <Button variant="warm" className="w-full" onClick={() => setSelectedRole("teacher")}>
                Continue as Teacher
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-6">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/auth")}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

