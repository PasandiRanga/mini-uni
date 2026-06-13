'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in seconds */
  delay?: number;
}

/**
 * Fades + lifts children into view the first time they enter the viewport.
 * Respects prefers-reduced-motion via the .reveal CSS rules.
 */
const Reveal = ({ children, className, delay = 0 }: RevealProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("reveal", className)} style={{ "--reveal-delay": `${delay}s` } as CSSProperties}>
      {children}
    </div>
  );
};

export default Reveal;
