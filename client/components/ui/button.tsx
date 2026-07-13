import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";
import { Spinner } from "./feedback";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "secondary",
  className,
  children,
  loading,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles: Record<Variant, string> = {
    primary: "bg-accent text-white hover:bg-[#a9583f]",
    secondary: "bg-surface text-ink border border-muted/30 hover:border-muted/60",
    ghost: "text-muted hover:text-ink hover:bg-paper",
    danger: "bg-surface text-[#b3462f] border border-[#b3462f]/30 hover:border-[#b3462f]/60",
  };
  return (
    <button
      className={cn(base, styles[variant], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
