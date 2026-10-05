'use client';

import { useState } from "react";
import { Check, ChevronsUpDown, Lock, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface SuggestInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options?: readonly string[];
  /** Options under headings (e.g. state vs private). Used instead of `options`. */
  groups?: readonly { label: string; options: readonly string[] }[];
  placeholder?: string;
  searchPlaceholder?: string;
  /** Shows the value read-only with a lock, e.g. when another field decides it. */
  locked?: boolean;
}

/**
 * Pick from a list, or type your own: a select-style trigger that opens a
 * searchable list. When the search text doesn't match an option exactly, a
 * "Use '…'" entry lets the user keep what they typed.
 */
export function SuggestInput({
  id,
  value,
  onChange,
  options = [],
  groups,
  placeholder = "Select…",
  searchPlaceholder = "Search or type…",
  locked = false,
}: SuggestInputProps) {
  const sections = groups ?? [{ label: "", options }];
  const allOptions = sections.flatMap((g) => g.options);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const typed = query.trim();
  const matchesOption = allOptions.some((o) => o.toLowerCase() === typed.toLowerCase());

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };

  if (locked) {
    return (
      <div
        id={id}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-muted/50 px-4 py-2 text-base text-muted-foreground md:text-sm"
      >
        <span className="truncate">{value}</span>
        <Lock className="ml-2 h-4 w-4 shrink-0 opacity-60" />
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-card px-4 py-2 text-left text-base shadow-soft transition-all duration-200 hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring md:text-sm"
        >
          <span className={cn("truncate", !value && "text-muted-foreground/70")}>{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        {/* Plain "contains" matching (it still finds "SLIIT" in "… (SLIIT)") and list
            order is kept, so loose fuzzy hits don't crowd out the obvious match. */}
        <Command
          shouldFilter
          filter={(itemValue, search) => (itemValue.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0)}
        >
          <CommandInput placeholder={searchPlaceholder} value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>Type to add your own.</CommandEmpty>
            {sections.map((group) => (
              <CommandGroup key={group.label} heading={group.label || undefined}>
                {group.options.map((option) => (
                  <CommandItem key={option} value={option} onSelect={() => choose(option)}>
                    <Check className={cn("mr-2 h-4 w-4", value === option ? "opacity-100" : "opacity-0")} />
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {/* Last, so Enter picks the best listed match rather than the raw text. */}
            {typed && !matchesOption && (
              <CommandGroup>
                <CommandItem forceMount value={`__custom__${typed}`} onSelect={() => choose(typed)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Use &ldquo;{typed}&rdquo;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
