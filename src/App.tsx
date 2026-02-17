import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicRoute from "@/components/auth/PublicRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SignUp from "./pages/SignUp";
import Feed from "./pages/Feed";
import HowItWorks from "./pages/HowItWorks";
import FindTeacher from "./pages/FindTeacher";
import TeacherProfile from "./pages/TeacherProfile";
import CreatePost from "./pages/CreatePost";
import MyPosts from "./pages/MyPosts";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherOnboarding from "./pages/TeacherOnboarding";
import NotFound from "./pages/NotFound";
import RootRedirect from "./pages/RootRedirect";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Root: Redirect authenticated users to dashboard, show landing for guests */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* Public pages: Only accessible to guests */}
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
            
            {/* Semi-public pages: Accessible to all but logged-in users see without navbar/footer */}
            <Route path="/feed" element={<Feed />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/teachers" element={<FindTeacher />} />
            <Route path="/teachers/:id" element={<TeacherProfile />} />
            
            {/* Protected pages: Require authentication */}
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute requiredRole="STUDENT">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/dashboard" 
              element={
                <ProtectedRoute requiredRole="TEACHER">
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/teacher/onboarding"
              element={
                <ProtectedRoute requiredRole="TEACHER">
                  <TeacherOnboarding />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/post/create" 
              element={
                <ProtectedRoute>
                  <CreatePost />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/post/mine"
              element={
                <ProtectedRoute>
                  <MyPosts />
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all: 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
