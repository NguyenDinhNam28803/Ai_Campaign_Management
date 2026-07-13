"use client";

import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth";
import type { ContentPiece, Organization } from "@/lib/types";
import { Card, ListSkeleton, PageHeader } from "@/components/ui";

function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-muted/40">
        <div className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
          {label}
        </div>
        <div className="mt-1 text-3xl font-bold tracking-tight">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isManager = user?.role === "ADMIN" || user?.role === "MANAGER";

  const { data: org } = useApi<Organization>("/organization");
  const { data: inReview, loading: l1 } =
    useApi<ContentPiece[]>("/content?status=IN_REVIEW");
  const { data: drafts, loading: l2 } =
    useApi<ContentPiece[]>("/content?status=DRAFT");

  const myDrafts = drafts?.filter((p) => p.createdBy === user?.userId) ?? [];
  const budget = org ? Number(org.monthlyAiBudgetUsd) : 0;
  const spend = org ? Number(org.aiSpendPeriodUsd) : 0;
  const pct = budget > 0 ? Math.min(100, (spend / budget) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Xin chào${user ? `, ${user.email.split("@")[0]}` : ""}`}
        subtitle="Hôm nay bạn cần làm gì?"
      />

      {l1 || l2 ? (
        <div className="grid gap-5 sm:grid-cols-3">
          <ListSkeleton rows={1} />
          <ListSkeleton rows={1} />
          <ListSkeleton rows={1} />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isManager && (
            <StatCard
              label="Chờ tôi duyệt"
              value={String(inReview?.length ?? 0)}
              hint="Mở hàng đợi duyệt"
              href="/review"
            />
          )}
          <StatCard
            label="Nháp của tôi"
            value={String(myDrafts.length)}
            hint="Bài bạn đang soạn"
            href="/content"
          />
          {isManager && (
            <StatCard
              label="Ngân sách AI"
              value={`${pct.toFixed(0)}%`}
              hint={
                budget === 0
                  ? "Chưa cấp ngân sách"
                  : `$${spend.toFixed(2)} / $${budget.toFixed(2)}`
              }
              href="/ai-usage"
            />
          )}
        </div>
      )}

      <Card>
        <div className="mb-3 text-[0.72rem] font-medium uppercase tracking-wide text-muted">
          Bắt đầu nhanh
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/content" className="font-medium text-accent hover:underline">
            Viết bài mới →
          </Link>
          <span className="text-muted/40">·</span>
          <Link href="/review" className="font-medium text-accent hover:underline">
            Duyệt bài →
          </Link>
          <span className="text-muted/40">·</span>
          <Link href="/campaigns" className="font-medium text-accent hover:underline">
            Xem chiến dịch →
          </Link>
        </div>
      </Card>
    </div>
  );
}
