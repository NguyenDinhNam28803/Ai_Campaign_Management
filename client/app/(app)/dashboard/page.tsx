"use client";

import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth";
import { resources } from "@/lib/resources";
import { isManager } from "@/lib/rbac";
import type { ContentPiece, Organization } from "@/lib/types";
import { ContentStatusBadge } from "@/components/status";
import {
  Card,
  ErrorState,
  Icon,
  ListSkeleton,
  PageHeader,
  StatCard,
} from "@/components/ui";

function PieceRow({ p }: { p: ContentPiece }) {
  return (
    <Link
      href={`/content/${p.id}`}
      className="flex items-center justify-between gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-paper"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-paper text-muted">
          <Icon name="doc" size={16} />
        </span>
        <span className="truncate text-sm font-medium">{p.title}</span>
      </div>
      <ContentStatusBadge status={p.status} />
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const manager = isManager(user?.role);

  const org = useApi<Organization>(() => resources.organization.get(), "org");
  const inReview = useApi<ContentPiece[]>(
    () => resources.content.list({ status: "IN_REVIEW" }),
    "content:IN_REVIEW",
  );
  const drafts = useApi<ContentPiece[]>(
    () => resources.content.list({ status: "DRAFT" }),
    "content:DRAFT",
  );
  const recent = useApi<ContentPiece[]>(() => resources.content.list(), "content:all");

  const loading = org.loading || inReview.loading || drafts.loading;
  const error = org.error || inReview.error || drafts.error;

  const myDrafts = drafts.data?.filter((p) => p.createdBy === user?.userId) ?? [];
  const budget = org.data ? Number(org.data.monthlyAiBudgetUsd) : 0;
  const spend = org.data ? Number(org.data.aiSpendPeriodUsd) : 0;
  const pct = budget > 0 ? Math.min(100, (spend / budget) * 100) : 0;

  const reloadAll = () => {
    org.reload();
    inReview.reload();
    drafts.reload();
    recent.reload();
  };

  const attention = manager ? (inReview.data ?? []).slice(0, 5) : myDrafts.slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Tổng quan"
        title={`Xin chào${user ? `, ${user.email.split("@")[0]}` : ""}`}
        subtitle="Hôm nay bạn cần làm gì?"
      />

      {error ? (
        <ErrorState message={error} onRetry={reloadAll} />
      ) : loading ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {manager && (
              <StatCard
                icon="clock"
                accent
                label="Chờ tôi duyệt"
                value={String(inReview.data?.length ?? 0)}
                hint="Mở hàng đợi duyệt"
                href="/review"
              />
            )}
            <StatCard
              icon="doc"
              label="Nháp của tôi"
              value={String(myDrafts.length)}
              hint="Bài bạn đang soạn"
              href="/content"
            />
            {manager && (
              <StatCard
                icon="money"
                label="Ngân sách AI"
                value={`${pct.toFixed(0)}%`}
                hint={budget === 0 ? "Chưa cấp ngân sách" : `$${spend.toFixed(2)} / $${budget.toFixed(2)}`}
                href="/ai-usage"
              />
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Cần chú ý */}
            <Card className="p-4">
              <div className="mb-2 flex items-center gap-2 px-1">
                <Icon name="alert" size={16} className="text-accent" />
                <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-muted">
                  {manager ? "Chờ bạn duyệt" : "Nháp của bạn"}
                </span>
              </div>
              {attention.length ? (
                <div className="flex flex-col">
                  {attention.map((p) => (
                    <PieceRow key={p.id} p={p} />
                  ))}
                </div>
              ) : (
                <p className="px-3 py-6 text-center text-sm text-muted">Không có mục nào cần xử lý 🎉</p>
              )}
            </Card>

            {/* Gần đây */}
            <Card className="p-4">
              <div className="mb-2 flex items-center gap-2 px-1">
                <Icon name="clock" size={16} className="text-muted" />
                <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-muted">
                  Gần đây
                </span>
              </div>
              {recent.data?.length ? (
                <div className="flex flex-col">
                  {recent.data.slice(0, 5).map((p) => (
                    <PieceRow key={p.id} p={p} />
                  ))}
                </div>
              ) : (
                <p className="px-3 py-6 text-center text-sm text-muted">Chưa có nội dung nào.</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
