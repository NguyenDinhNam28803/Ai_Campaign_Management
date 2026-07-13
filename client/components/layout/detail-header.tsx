import Link from "next/link";
import type { ReactNode } from "react";

/** Header cho trang chi tiết: back-link + tiêu đề + phụ đề + slot bên phải. */
export function DetailHeader({
  backHref,
  backLabel,
  title,
  subtitle,
  right,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div>
      <Link href={backHref} className="text-sm text-muted hover:text-accent">
        ← {backLabel}
      </Link>
      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {right}
      </div>
      {subtitle && <div className="mt-0.5 text-sm text-muted">{subtitle}</div>}
    </div>
  );
}
