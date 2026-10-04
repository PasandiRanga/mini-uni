'use client';

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

export interface WidgetDef {
  id: string;
  label: string;
  description?: string;
}

/**
 * Which overview widgets this browser shows. Stored per dashboard (key) as
 * the list of hidden ids, so widgets added later appear by default.
 */
export function useWidgetPrefs(storageKey: string) {
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setHidden(JSON.parse(raw));
    } catch {
      /* storage unavailable or corrupt: show everything */
    }
  }, [storageKey]);

  const save = useCallback(
    (next: string[]) => {
      setHidden(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* not remembered, still applied */
      }
    },
    [storageKey]
  );

  const isVisible = useCallback((id: string) => !hidden.includes(id), [hidden]);
  const setVisible = useCallback(
    (id: string, visible: boolean) => save(visible ? hidden.filter((h) => h !== id) : [...hidden, id]),
    [hidden, save]
  );
  const reset = useCallback(() => save([]), [save]);

  return { isVisible, setVisible, reset, hiddenCount: hidden.length };
}

interface CustomizeWidgetsProps {
  widgets: WidgetDef[];
  isVisible: (id: string) => boolean;
  setVisible: (id: string, visible: boolean) => void;
  reset: () => void;
  hiddenCount: number;
}

/** "Customize" button with a panel of on/off switches, one per widget. */
export function CustomizeWidgets({ widgets, isVisible, setVisible, reset, hiddenCount }: CustomizeWidgetsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <LayoutGrid className="h-4 w-4" />
          Customize
          {hiddenCount > 0 && (
            <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold tabular-nums">{hiddenCount} hidden</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b border-border/60 px-4 py-3">
          <p className="text-sm font-semibold">Your overview</p>
          <p className="text-xs text-muted-foreground">Choose what shows on this page.</p>
        </div>
        <div className="space-y-1 p-2">
          {widgets.map((w) => (
            <label
              key={w.id}
              htmlFor={`widget-${w.id}`}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium">{w.label}</span>
                {w.description && <span className="block text-xs text-muted-foreground">{w.description}</span>}
              </span>
              <Switch id={`widget-${w.id}`} checked={isVisible(w.id)} onCheckedChange={(v) => setVisible(w.id, v)} />
            </label>
          ))}
        </div>
        <div className="border-t border-border/60 p-2">
          <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground" onClick={reset} disabled={hiddenCount === 0}>
            <RotateCcw className="h-3.5 w-3.5" /> Show everything
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
