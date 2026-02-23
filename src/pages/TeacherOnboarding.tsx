'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const requiredDocs = [
  { key: "ID", label: "Government ID (passport, national ID)" },
  { key: "ADDRESS_PROOF", label: "Proof of Address" },
  { key: "BANK_DETAILS", label: "Bank Details (scan/photo)" },
];

const optionalDocs = [{ key: "UNIVERSITY_ID", label: "University ID (if applicable)" }];

const TeacherOnboarding = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (key: string, file?: File) => {
    setFiles((s) => ({ ...s, [key]: file || null }));
  };

  const toDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Upload required docs first
      for (const doc of requiredDocs.concat(optionalDocs)) {
        const file = files[doc.key];
        if (!file && requiredDocs.find(d => d.key === doc.key)) {
          continue;
        }

        if (file) {
          const documentUrl = await toDataUrl(file);
          const res = await fetch(`/api/teachers/upload-document`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ documentType: doc.key, documentUrl }),
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "Upload failed");
          }
        }
      }

      toast({ title: "Uploaded", description: "Documents uploaded. Verification will proceed shortly." });
      router.push('/teacher/dashboard');
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message || String(e), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-8">
      <div className="w-full max-w-3xl bg-card rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-4">Onboarding & Verification</h2>
        <p className="text-muted-foreground mb-6">Upload the required documents so admins can verify your account. You can still view your dashboard while verification is pending, but class-related actions will remain restricted until approved.</p>

        <div className="space-y-6">
          {requiredDocs.map((d) => (
            <div key={d.key} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="font-medium">{d.label}</div>
                <div className="text-sm text-muted-foreground">Required</div>
              </div>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(d.key, e.target.files?.[0])}
              />
            </div>
          ))}

          {optionalDocs.map((d) => (
            <div key={d.key} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="font-medium">{d.label}</div>
                <div className="text-sm text-muted-foreground">Optional</div>
              </div>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(d.key, e.target.files?.[0])}
              />
            </div>
          ))}

          <div className="flex items-center gap-3">
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Uploading...' : 'Submit Documents'}
            </Button>
            <Button variant="ghost" onClick={() => router.push('/teacher/dashboard')}>Back to Dashboard</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherOnboarding;
