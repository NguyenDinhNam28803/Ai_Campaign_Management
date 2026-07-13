import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-accent">
            {eyebrow}
          </div>
        )}
        <h1 className="text-[2rem] font-bold leading-tight tracking-[-0.02em] text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex-none">{action}</div>}
    </header>
  );
}
