"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Spinner, cn } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/product-lines", label: "Dòng sản phẩm" },
  { href: "/campaigns", label: "Chiến dịch" },
  { href: "/content", label: "Nội dung" },
  { href: "/users", label: "Người dùng", adminOnly: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-full items-center justify-center text-muted">
        <Spinner />
      </div>
    );
  }

  const links = NAV.filter((n) => !n.adminOnly || user.role === "ADMIN");

  return (
    <div className="mx-auto flex min-h-full max-w-6xl">
      {/* Sidebar */}
      <aside className="flex w-60 flex-none flex-col border-r border-muted/15 px-5 py-7">
        <div className="mb-8 px-2">
          <div className="text-[0.72rem] font-medium uppercase tracking-widest text-accent">
            AI Content
          </div>
          <div className="text-sm font-semibold">Platform</div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {links.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-paper font-medium text-ink"
                    : "text-muted hover:text-ink",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-muted/15 pt-4">
          <div className="px-2 text-sm font-medium text-ink">{user.email}</div>
          <div className="mb-3 px-2 text-[0.72rem] uppercase tracking-wide text-muted">
            {user.role}
          </div>
          <button
            onClick={logout}
            className="w-full rounded-md px-2 py-1.5 text-left text-sm text-muted transition-colors hover:text-accent"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
