"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader, cn } from "@/components/ui";

const TABS = [
  { href: "/settings/organization", label: "Tổ chức" },
  { href: "/settings/users", label: "Người dùng" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Cấu hình" subtitle="Chỉ ADMIN quản lý các thiết lập này." />
      <nav className="flex gap-1 border-b border-muted/15">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "-mb-px border-b-2 px-4 py-2 text-sm transition-colors",
                active
                  ? "border-accent font-medium text-ink"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <div>{children}</div>
    </div>
  );
}
