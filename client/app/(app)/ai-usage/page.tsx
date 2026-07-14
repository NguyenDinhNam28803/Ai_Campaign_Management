"use client";

import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth";
import { resources } from "@/lib/resources";
import { isManager } from "@/lib/rbac";
import type { Organization } from "@/lib/types";
import { Card, ErrorState, ListSkeleton, PageHeader, Ring } from "@/components/ui";

export default function AiUsagePage() {
  const { user } = useAuth();
  const { data: org, loading, error, reload } = useApi<Organization>(
    () => resources.organization.get(),
    "org",
  );

  const budget = org ? Number(org.monthlyAiBudgetUsd) : 0;
  const spend = org ? Number(org.aiSpendPeriodUsd) : 0;
  const pct = budget > 0 ? (spend / budget) * 100 : 0;
  const over80 = pct >= 80;

  if (user && !isManager(user.role)) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Chi phí AI" />
        <Card>
          <p className="text-sm text-muted">Chỉ ADMIN và MANAGER xem được trang chi phí AI.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Minh bạch"
        title="Chi phí AI"
        subtitle="Minh bạch chi tiêu AI trong kỳ so với ngân sách tháng."
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <ListSkeleton rows={2} />
      ) : (
        <>
          {over80 && (
            <div className="rounded-md border border-[#b8912f]/25 bg-[#b8912f]/10 px-4 py-3 text-sm text-[#8a6d1f]">
              ⚠ Đã dùng {pct.toFixed(0)}% ngân sách AI tháng này (${spend.toFixed(2)}/${budget.toFixed(2)}).
              Cân nhắc nâng trần ở <span className="font-medium">Cấu hình → Tổ chức</span> trước khi bị chặn.
            </div>
          )}

          <Card className="max-w-xl">
            <div className="flex items-center gap-8">
              <Ring
                pct={pct}
                color={over80 ? "#b8912f" : "var(--color-accent)"}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
                  Đã dùng trong kỳ
                </div>
                <div className="mt-1 text-2xl font-bold tracking-tight">
                  ${spend.toFixed(2)}
                  <span className="ml-2 text-base font-normal text-muted">
                    / ${budget.toFixed(2)}
                  </span>
                </div>
                <dl className="mt-4 flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Còn lại</dt>
                    <dd className="font-medium">${Math.max(0, budget - spend).toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Model</dt>
                    <dd className="font-mono text-xs">{org?.defaultModel}</dd>
                  </div>
                </dl>
                {budget === 0 && (
                  <p className="mt-3 text-xs text-muted">
                    Chưa cấp ngân sách — gọi AI bị chặn cho tới khi đặt trần &gt; 0.
                  </p>
                )}
              </div>
            </div>
          </Card>

          <p className="text-xs text-muted">
            Breakdown theo dòng sản phẩm / người dùng / loại (Generator vs Assistant) sẽ có khi backend
            bổ sung endpoint tổng hợp generation.
          </p>
        </>
      )}
    </div>
  );
}
