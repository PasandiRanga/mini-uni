/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, ArrowRight, Phone, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface TeacherSignUpProps {
  onBack: () => void;
}

type OnboardingStep = "register" | "documents";

const TeacherSignUp = ({ onBack }: TeacherSignUpProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, token } = useAuth();
  const [step, setStep] = useState<OnboardingStep>("register");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [documents, setDocuments] = useState({
    ID: null as File | null,
    UNIVERSITY_ID: null as File | null,
    ADDRESS_PROOF: null as File | null,
    BANK_DETAILS: null as File | null,
  });

  // Fetch verification progress after registration
  useEffect(() => {
    if (token && step === "documents") {
      fetchVerificationProgress();
    }
  }, [token, step]);

  const fetchVerificationProgress = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/teachers/verification-progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const text = await response.text();
        if (text && text.trim()) {
          try {
            const data = JSON.parse(text);
            setVerificationProgress(data);
          } catch (e) {
            console.error("Failed to parse verification progress:", e);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch verification progress:", error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use Auth context register so app state is updated
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phone,
        'TEACHER'
      );

      toast({
        title: "Account created!",
        description: "Account created — redirecting to your dashboard. Complete verification to start teaching.",
      });

      navigate('/teacher/dashboard');
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (docType: keyof typeof documents, file: File | null) => {
    setDocuments({ ...documents, [docType]: file });
  };

  const uploadDocument = async (docType: string, file: File) => {
    // In a real app, you'd upload to a file storage service (S3, Cloudinary, etc.)
    // For now, we'll create a data URL as a placeholder
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDocumentSubmit = async () => {
    if (!token) return;

    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      
      // Upload each document
      for (const [docType, file] of Object.entries(documents)) {
        if (file) {
          const documentUrl = await uploadDocument(docType, file);
          
          const response = await fetch(`${apiUrl}/teachers/upload-document`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              documentType: docType,
              documentUrl: documentUrl,
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            let errorData;
            try {
              errorData = text ? JSON.parse(text) : {};
            } catch {
              errorData = { message: text || "Upload failed" };
            }
            throw new Error(errorData.message || errorData.error || `Upload failed with status ${response.status}`);
          }
        }
      }

      await fetchVerificationProgress();

      toast({
        title: "Documents uploaded!",
        description: "Your documents are under review. You'll be notified once verification is complete.",
      });

      // Navigate to teacher dashboard (but they'll be blocked until verified)
      navigate("/teacher/dashboard");
    } catch (error: any) {
      let errorMessage = "Failed to upload documents. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Cannot connect to server. Please make sure the backend is running.";
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "register") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <CardTitle className="text-2xl">Create Teacher Account</CardTitle>
            <CardDescription>
              Start by creating your account. You'll need to complete verification before teaching.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      className="pl-9"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+94 77 123 4567"
                    className="pl-9"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="warm"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Continue to Verification"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Document upload step - provide sensible defaults if backend doesn't return config
  const defaultRequired = [
    { type: "ID", uploaded: false, status: "PENDING" },
    { type: "ADDRESS_PROOF", uploaded: false, status: "PENDING" },
    { type: "BANK_DETAILS", uploaded: false, status: "PENDING" },
  ];
  const defaultOptional = [
    { type: "UNIVERSITY_ID", uploaded: false, status: "PENDING" },
  ];

  const requiredDocs = verificationProgress?.requiredDocuments?.length ? verificationProgress.requiredDocuments : defaultRequired;
  const optionalDocs = verificationProgress?.optionalDocuments?.length ? verificationProgress.optionalDocuments : defaultOptional;
  const progress = typeof verificationProgress?.progress === "number" ? verificationProgress.progress : 20;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("register")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <CardTitle className="text-2xl">Teacher Verification</CardTitle>
          <CardDescription>
            Upload your verification documents to start teaching. All documents must be verified by our admin team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Verification Progress</Label>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {verificationProgress?.canStartClasses
                ? "✓ Verification complete! You can now start teaching."
                : "Please upload all required documents. You cannot start classes until verification is complete."}
            </p>
          </div>

          {/* Required Documents */}
          <div className="space-y-4">
            <h3 className="font-semibold">Required Documents</h3>
            {requiredDocs.map((doc: any) => (
              <div key={doc.type} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <Label className="font-medium">
                      {doc.type === "ID" && "Valid ID (National ID or Passport)"}
                      {doc.type === "ADDRESS_PROOF" && "Proof of Address (Electricity bill or Grama Niladhari certificate)"}
                      {doc.type === "BANK_DETAILS" && "Bank Details (Bank statement or certified copy of bank passbook)"}
                    </Label>
                  </div>
                  {doc.status === "APPROVED" && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {doc.status === "PENDING" && (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  {doc.status === "REJECTED" && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                {doc.uploaded ? (
                  <p className="text-sm text-muted-foreground">
                    Status: {doc.status === "APPROVED" ? "Approved" : doc.status === "PENDING" ? "Under Review" : "Rejected"}
                  </p>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChange(doc.type as keyof typeof documents, file);
                      }}
                      className="flex-1"
                    />
                    {documents[doc.type as keyof typeof documents] && (
                      <span className="text-sm text-muted-foreground">
                        {documents[doc.type as keyof typeof documents]?.name}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Optional Documents */}
          {optionalDocs.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Optional Documents</h3>
              {optionalDocs.map((doc: any) => (
                <div key={doc.type} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <Label className="font-medium">
                        {doc.type === "UNIVERSITY_ID" && "University ID or Proof of Student Status (for university students only)"}
                      </Label>
                    </div>
                    {doc.status === "APPROVED" && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {doc.uploaded ? (
                    <p className="text-sm text-muted-foreground">
                      Status: {doc.status === "APPROVED" ? "Approved" : "Under Review"}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileChange(doc.type as keyof typeof documents, file);
                        }}
                        className="flex-1"
                      />
                      {documents[doc.type as keyof typeof documents] && (
                        <span className="text-sm text-muted-foreground">
                          {documents[doc.type as keyof typeof documents]?.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Warning Message */}
          {!verificationProgress?.canStartClasses && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Verification Required
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    You cannot start or accept classes until all required documents are uploaded and verified by our admin team.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleDocumentSubmit}
            variant="warm"
            className="w-full"
            disabled={isLoading || verificationProgress?.canStartClasses}
          >
            {isLoading ? "Uploading..." : verificationProgress?.canStartClasses ? "Verification Complete" : "Submit Documents"}
            <Upload className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherSignUp;

