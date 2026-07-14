"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Icon, type IconName, Spinner, cn } from "@/components/ui";
import type { Role } from "@/lib/types";

const NAV: {
  href: string;
  label: string;
  icon: IconName;
  match?: string;
  roles?: Role[];
}[] = [
  { href: "/dashboard", label: "Tổng quan", icon: "home" },
  { href: "/content", label: "Nội dung", icon: "doc" },
  { href: "/review", label: "Duyệt", icon: "inbox" },
  { href: "/campaigns", label: "Chiến dịch", icon: "megaphone" },
  { href: "/product-lines", label: "Dòng sản phẩm", icon: "layers" },
  { href: "/ai-usage", label: "Chi phí AI", icon: "money", roles: ["ADMIN", "MANAGER"] },
  {
    href: "/settings/organization",
    label: "Cấu hình",
    icon: "settings",
    match: "/settings",
    roles: ["ADMIN"],
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-white">
        <Icon name="sparkles" size={18} />
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-ink">AI Content</div>
        <div className="text-[0.68rem] uppercase tracking-widest text-muted">Platform</div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  // Đóng menu mobile khi đổi route.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-full items-center justify-center text-muted">
        <Spinner />
      </div>
    );
  }

  const links = NAV.filter((n) => !n.roles || n.roles.includes(user.role));
  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col md:flex-row">
      {/* Thanh trên (mobile) */}
      <div className="flex items-center justify-between border-b border-muted/15 px-4 py-3 md:hidden">
        <Logo />
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={mobileOpen}
          className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-paper hover:text-ink"
        >
          <Icon name={mobileOpen ? "close" : "menu"} size={20} />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "flex-none flex-col border-muted/15 px-4 py-6 md:flex md:w-60 md:border-r",
          mobileOpen ? "flex border-b" : "hidden",
        )}
      >
        <div className="mb-8 hidden px-2 md:block">
          <Logo />
        </div>

        <nav className="flex flex-col gap-0.5">
          {links.map((n) => {
            const active = pathname.startsWith(n.match ?? n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-accent bg-paper font-medium text-ink"
                    : "border-transparent text-muted hover:bg-paper/60 hover:text-ink",
                )}
              >
                <Icon name={n.icon} size={18} className={active ? "text-accent" : ""} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 flex items-center gap-2.5 border-t border-muted/15 pt-4 md:mt-auto">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-paper text-xs font-semibold text-ink">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink">{user.email}</div>
            <div className="text-[0.68rem] uppercase tracking-wide text-muted">{user.role}</div>
          </div>
          <button
            onClick={logout}
            title="Đăng xuất"
            aria-label="Đăng xuất"
            className="grid h-8 w-8 flex-none place-items-center rounded-md text-muted transition-colors hover:bg-paper hover:text-accent"
          >
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </aside>

      {/* Nội dung */}
      <main className="flex-1 px-5 py-6 md:px-10 md:py-8">{children}</main>
    </div>
  );
}
