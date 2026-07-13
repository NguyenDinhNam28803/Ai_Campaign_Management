import Link from "next/link";
import { Card } from "./card";
import { cn } from "./cn";
import { Icon, type IconName } from "./icon";

export function StatCard({
  icon,
  label,
  value,
  hint,
  href,
  accent,
}: {
  icon: IconName;
  label: string;
  value: string;
  hint?: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="flex items-start gap-4 p-5 transition-colors hover:border-muted/40">
        <div
          className={cn(
            "grid h-10 w-10 flex-none place-items-center rounded-md",
            accent ? "bg-accent/10 text-accent" : "bg-paper text-muted",
          )}
        >
          <Icon name={icon} size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
            {label}
          </div>
          <div className="mt-0.5 text-2xl font-bold leading-tight tracking-tight">{value}</div>
          {hint && <div className="mt-0.5 truncate text-xs text-muted">{hint}</div>}
        </div>
      </Card>
    </Link>
  );
}
