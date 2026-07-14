"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Hàng bảng điều hướng như một link: click chuột + phím Enter/Space,
 * kèm role/tabIndex/aria-label cho a11y. Giữ pattern ở một nơi để mọi
 * bảng có hàng bấm được đều nhất quán và đúng khả năng truy cập.
 */
export function TableRowLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <tr
      tabIndex={0}
      role="link"
      aria-label={label}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
      className="cursor-pointer transition-colors hover:bg-paper focus-visible:bg-paper"
    >
      {children}
    </tr>
  );
}
