'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, IdCard, CreditCard, BookUser, Upload, CheckCircle2 } from "lucide-react";
import { compressImage, MAX_RAW_UPLOAD_BYTES } from "@/lib/imageCompress";

type IdType = "NIC" | "LICENSE" | "PASSPORT";

const ID_TYPES: { value: IdType; label: string; icon: typeof IdCard; needsBack: boolean }[] = [
  { value: "NIC", label: "National ID (NIC)", icon: IdCard, needsBack: true },
  { value: "LICENSE", label: "Driver's License", icon: CreditCard, needsBack: true },
  { value: "PASSPORT", label: "Passport", icon: BookUser, needsBack: false },
];

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

interface IdentityVerificationFormProps {
  onSaved?: () => void;
}

const IdentityVerificationForm = ({ onSaved }: IdentityVerificationFormProps) => {
  const { toast } = useToast();
  const [idType, setIdType] = useState<IdType | "">("");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [frontOnFile, setFrontOnFile] = useState(false);
  const [backOnFile, setBackOnFile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/teachers/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return;
        if (d.idType) setIdType(d.idType);
        setFrontOnFile(d.idFrontUploaded === "yes");
        setBackOnFile(d.idBackUploaded === "yes");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const selected = ID_TYPES.find((t) => t.value === idType);
  const needsBack = selected?.needsBack ?? false;

  const upload = async (documentType: string, file: File) => {
    // Photos are shrunk (kept sharp enough to read an ID); PDFs go as-is under a size cap,
    // since the API rejects requests over 4.5 MB.
    let documentUrl: string;
    if (file.type.startsWith("image/")) {
      documentUrl = await compressImage(file, { maxDimension: 2200, quality: 0.85 });
    } else if (file.size > MAX_RAW_UPLOAD_BYTES) {
      throw new Error("PDFs must be 3 MB or smaller. Upload a photo of the document instead.");
    } else {
      documentUrl = await toDataUrl(file);
    }
    const res = await fetch("/api/teachers/upload-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentType, documentUrl }),
    });
    if (res.status === 413) throw new Error("That file is too large. Try a smaller photo.");
    if (!res.ok) throw new Error((await res.text()) || "Upload failed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idType) {
      toast({ title: "Select a document type", variant: "destructive" });
      return;
    }
    if (!front && !frontOnFile) {
      toast({ title: "Front image required", description: "Please upload the front of your document.", variant: "destructive" });
      return;
    }
    if (needsBack && !back && !backOnFile) {
      toast({ title: "Back image required", description: "This document type needs both sides.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Save the chosen type, then upload whichever scans were (re)selected
      await fetch("/api/teachers/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idType }),
      });
      if (front) await upload("ID_FRONT", front);
      if (needsBack && back) await upload("ID_BACK", back);

      if (front) setFrontOnFile(true);
      if (back) setBackOnFile(true);
      toast({ title: "Saved", description: "Identity documents submitted for review." });
      onSaved?.();
    } catch (err: unknown) {
      toast({
        title: "Couldn't save",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const uploadBox = (label: string, file: File | null, onFile: boolean, setter: (f: File | null) => void) => (
    <div className="space-y-1.5">
      <Label>
        {label} <span className="text-primary">*</span>
      </Label>
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-4 transition-colors hover:border-primary/50 hover:bg-muted/50">
        {file || onFile ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" strokeWidth={1.75} />
        ) : (
          <Upload className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        )}
        <span className="min-w-0 flex-1 truncate text-sm">
          {file ? file.name : onFile ? "Uploaded — choose a new file to replace" : "Click to upload (image or PDF)"}
        </span>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => setter(e.target.files?.[0] || null)}
        />
      </label>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2.5">
        <Label>
          Document type <span className="text-primary">*</span>
        </Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {ID_TYPES.map((t) => {
            const active = idType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setIdType(t.value)}
                className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-300 ${
                  active
                    ? "border-primary bg-primary/[0.06] shadow-soft"
                    : "border-border/70 hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <t.icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.75} />
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.needsBack ? "Front & back" : "Front only"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {idType && (
        <div className="grid gap-5 sm:grid-cols-2">
          {uploadBox("Front side", front, frontOnFile, setFront)}
          {needsBack && uploadBox("Back side", back, backOnFile, setBack)}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Check className="h-4 w-4" /> Save & continue
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default IdentityVerificationForm;
