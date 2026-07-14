"use client";

import type { ReactNode } from "react";
import { Card } from "./card";

/**
 * Card bọc một form tạo/sửa: tự preventDefault rồi gọi onSubmit. Gom phần
 * boilerplate lặp ở các trang danh sách; layout field do `className` quyết
 * định (mặc định xếp dọc).
 */
export function FormCard({
  onSubmit,
  className,
  children,
}: {
  onSubmit: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className={className ?? "flex flex-col gap-4"}
      >
        {children}
      </form>
    </Card>
  );
}
