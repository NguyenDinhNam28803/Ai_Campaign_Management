"use client";

import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth";
import type { Organization } from "@/lib/types";
import { Card, Spinner } from "@/components/ui";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: org, loading } = useApi<Organization>("/organization");

  const budget = org ? Number(org.monthlyAiBudgetUsd) : 0;
  const spend = org ? Number(org.aiSpendPeriodUsd) : 0;
  const pct = budget > 0 ? Math.min(100, (spend / budget) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
        <p className="mt-1 text-sm text-muted">
          Xin chào {user?.email} · vai trò {user?.role}
        </p>
      </header>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <Card>
            <div className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
              Tổ chức
            </div>
            <div className="mt-1 text-lg font-semibold">{org?.name}</div>
            <div className="mt-4 text-[0.72rem] font-medium uppercase tracking-wide text-muted">
              Model mặc định
            </div>
            <div className="mt-1 font-mono text-sm">{org?.defaultModel}</div>
          </Card>

          <Card>
            <div className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
              Ngân sách AI tháng này
            </div>
            <div className="mt-1 text-2xl font-bold tracking-tight">
              ${spend.toFixed(2)}
              <span className="ml-1 text-sm font-normal text-muted">
                / ${budget.toFixed(2)}
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-sm bg-paper">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-muted">
              {budget === 0
                ? "Chưa cấp ngân sách — gọi AI sẽ bị chặn."
                : `Đã dùng ${pct.toFixed(0)}%`}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
