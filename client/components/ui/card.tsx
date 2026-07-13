import type { ReactNode } from "react";
import { cn } from "./cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-muted/15 bg-surface p-6", className)}>
      {children}
    </div>
  );
}
