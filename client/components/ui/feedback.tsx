import type { ReactNode } from "react";
import { cn } from "./cn";
import { Icon, type IconName } from "./icon";

/* ── Badge ──────────────────────────────────────────────── */
type Tone = "neutral" | "accent" | "green" | "amber" | "red";

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
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
  icon = "inbox",
  title,
  hint,
  action,
}: {
  icon?: IconName;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-muted/30 bg-surface/50 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-paper text-muted">
        <Icon name={icon} size={22} />
      </div>
      <p className="font-medium text-ink">{title}</p>
      {hint && <p className="max-w-md text-sm text-muted">{hint}</p>}
      {action && <div className="mt-1 flex gap-3">{action}</div>}
    </div>
  );
}

/* ── ErrorState (U1: lỗi tải phải hiện rõ + thử lại) ─────── */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-[#b3462f]/25 bg-[#b3462f]/5 px-6 py-12 text-center">
      <p className="font-medium text-[#b3462f]">Không tải được dữ liệu</p>
      <p className="max-w-md text-sm text-muted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md border border-muted/30 bg-surface px-4 py-1.5 text-sm text-ink hover:border-muted/60"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/15", className)} aria-hidden />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
