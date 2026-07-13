"use client";

import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth";
import type { Organization } from "@/lib/types";
import { Card, ListSkeleton, PageHeader } from "@/components/ui";

export default function AiUsagePage() {
  const { user } = useAuth();
  const { data: org, loading } = useApi<Organization>("/organization");

  const budget = org ? Number(org.monthlyAiBudgetUsd) : 0;
  const spend = org ? Number(org.aiSpendPeriodUsd) : 0;
  const pct = budget > 0 ? (spend / budget) * 100 : 0;
  const over80 = pct >= 80;

  if (user && user.role !== "ADMIN" && user.role !== "MANAGER") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Chi phí AI" />
        <Card>
          <p className="text-sm text-muted">
            Chỉ ADMIN và MANAGER xem được trang chi phí AI.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Chi phí AI"
        subtitle="Minh bạch chi tiêu AI trong kỳ so với ngân sách tháng."
      />

      {loading ? (
        <ListSkeleton rows={2} />
      ) : (
        <>
          {over80 && (
            <div className="rounded-md border border-[#b8912f]/25 bg-[#b8912f]/10 px-4 py-3 text-sm text-[#8a6d1f]">
              ⚠ Đã dùng {pct.toFixed(0)}% ngân sách AI tháng này ($
              {spend.toFixed(2)}/${budget.toFixed(2)}). Cân nhắc nâng trần ở{" "}
              <span className="font-medium">Cấu hình → Tổ chức</span> trước khi bị chặn.
            </div>
          )}

          <Card className="max-w-xl">
            <div className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
              Đã dùng trong kỳ
            </div>
            <div className="mt-1 text-3xl font-bold tracking-tight">
              ${spend.toFixed(2)}
              <span className="ml-2 text-base font-normal text-muted">
                / ${budget.toFixed(2)} ngân sách
              </span>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-sm bg-paper">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-muted">
              {budget === 0
                ? "Chưa cấp ngân sách — gọi AI bị chặn cho tới khi đặt trần > 0."
                : `Còn lại $${Math.max(0, budget - spend).toFixed(2)} · model ${org?.defaultModel}`}
            </div>
          </Card>

          <p className="text-xs text-muted">
            Breakdown theo dòng sản phẩm / người dùng / loại (Generator vs Assistant)
            sẽ có khi backend bổ sung endpoint tổng hợp generation.
          </p>
        </>
      )}
    </div>
  );
}
