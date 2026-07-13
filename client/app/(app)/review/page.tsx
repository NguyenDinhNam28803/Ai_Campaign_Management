"use client";

import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { resources } from "@/lib/resources";
import type { Campaign, ContentPiece } from "@/lib/types";
import { Badge, Card, EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/ui";

export default function ReviewQueuePage() {
  const { data, loading, error, reload } = useApi<ContentPiece[]>(
    () => resources.content.list({ status: "IN_REVIEW" }),
    "content:IN_REVIEW",
  );
  const campaigns = useApi<Campaign[]>(() => resources.campaigns.list(), "campaigns");
  const campaignName = (id: string) => campaigns.data?.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Hàng đợi duyệt"
        subtitle="Các bài đang chờ duyệt. Mở một bài để duyệt hoặc yêu cầu sửa."
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <ListSkeleton />
      ) : !data?.length ? (
        <EmptyState
          title="Không có bài nào chờ duyệt"
          hint="Khi ai đó gửi bài để duyệt, bài sẽ xuất hiện ở đây."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((p) => (
            <Link key={p.id} href={`/content/${p.id}`}>
              <Card className="flex items-center justify-between p-4 transition-colors hover:border-muted/40">
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.title}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {campaignName(p.campaignId)} · {p.contentType}
                  </div>
                  {p.currentVersion && (
                    <p className="mt-1 line-clamp-1 max-w-xl text-xs text-muted/80">
                      {p.currentVersion.body}
                    </p>
                  )}
                </div>
                <Badge tone="amber">Chờ duyệt</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
