import type { ReactNode } from "react";

/** Bảng gọn cho danh sách có cấu trúc (giữ phẳng, dùng nhịp + phân cách nhẹ). */
export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-muted/15 bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-muted/15 text-left">{head}</tr>
        </thead>
        <tbody className="divide-y divide-muted/10">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className ?? ""}`}>{children}</td>;
}
