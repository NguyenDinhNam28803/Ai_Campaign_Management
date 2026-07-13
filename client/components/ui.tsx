import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ── Button ─────────────────────────────────────────────── */
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
    secondary:
      "bg-surface text-ink border border-muted/30 hover:border-muted/60",
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

/* ── Card ───────────────────────────────────────────────── */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-muted/15 bg-surface p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── Label + Field ──────────────────────────────────────── */
export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

/* ── Inputs ─────────────────────────────────────────────── */
const fieldCls =
  "w-full rounded-md border border-muted/30 bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldCls, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={cn(fieldCls, "resize-y", props.className)} />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldCls, props.className)} />;
}

/* ── Badge ──────────────────────────────────────────────── */
type Tone = "neutral" | "accent" | "green" | "amber" | "red";

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const tones: Record<Tone, string> = {
    neutral: "bg-paper text-muted border-muted/20",
    accent: "bg-accent/10 text-accent border-accent/20",
    green: "bg-[#5f7a44]/10 text-[#4f6a38] border-[#5f7a44]/20",
    amber: "bg-[#b8912f]/10 text-[#8a6d1f] border-[#b8912f]/20",
    red: "bg-[#b3462f]/10 text-[#b3462f] border-[#b3462f]/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-[0.72rem] font-medium tracking-wide",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/* ── Spinner ────────────────────────────────────────────── */
export function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

/* ── EmptyState ─────────────────────────────────────────── */
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-muted/30 bg-surface/50 px-6 py-14 text-center">
      <p className="font-medium text-ink">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
      {action}
    </div>
  );
}
