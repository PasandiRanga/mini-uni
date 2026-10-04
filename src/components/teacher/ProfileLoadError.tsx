'use client';

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown instead of a profile form when its saved values couldn't be loaded,
 * so an empty form can never be saved over the teacher's real details.
 */
const ProfileLoadError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center gap-3 py-10 text-center">
    <AlertCircle className="h-6 w-6 text-destructive" />
    <div>
      <p className="text-sm font-medium">We couldn&apos;t load your saved details</p>
      <p className="text-xs text-muted-foreground">Nothing has been lost. Please try again in a moment.</p>
    </div>
    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onRetry}>
      <RotateCcw className="h-3.5 w-3.5" /> Try again
    </Button>
  </div>
);

export default ProfileLoadError;
