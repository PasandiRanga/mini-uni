'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { Lock } from "lucide-react";

/**
 * Settings row for the account password. The password itself can't be shown
 * (it's only stored hashed), so it appears masked; the change form opens in a
 * modal.
 */
export const PasswordSettings = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">Password</p>
        <p className="mt-1 select-none font-mono text-lg leading-none tracking-[0.3em] text-muted-foreground">••••••••</p>
      </div>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Lock className="h-4 w-4" /> Change password
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new one. You&apos;ll stay signed in here; other devices are signed out.
            </DialogDescription>
          </DialogHeader>
          <ChangePasswordForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
