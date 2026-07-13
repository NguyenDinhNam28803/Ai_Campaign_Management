"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/lib/use-api";
import type { Campaign, ContentPiece, ContentStatus } from "@/lib/types";
import { Badge, Card, ListSkeleton } from "@/components/ui";

const COLUMNS: { status: ContentStatus; label: string }[] = [
  { status: "DRAFT", label: "Nháp" },
  { status: "IN_REVIEW", label: "Chờ duyệt" },
  { status: "APPROVED", label: "Đã duyệt" },
  { status: "PUBLISHED", label: "Đã đăng" },
];

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, loading } = useApi<Campaign>(`/campaigns/${id}`);
  const { data: pieces } = useApi<ContentPiece[]>(`/content?campaignId=${id}`);

  if (loading || !campaign) return <ListSkeleton rows={2} />;

  const byStatus = (s: ContentStatus) =>
    pieces?.filter((p) => p.status === s) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/campaigns" className="text-sm text-muted hover:text-accent">
          ← Chiến dịch
        </Link>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
            {campaign.goal && (
              <p className="mt-0.5 text-sm text-muted">{campaign.goal}</p>
            )}
          </div>
          <Badge>{campaign.status}</Badge>
        </div>
      </div>

      {/* Kanban theo state machine backend */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = byStatus(col.status);
          return (
            <div key={col.status} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
                  {col.label}
                </span>
                <span className="text-xs text-muted">{items.length}</span>
              </div>
              <div className="flex min-h-16 flex-col gap-2 rounded-lg border border-dashed border-muted/20 bg-paper/40 p-2">
                {items.map((p) => (
                  <Link key={p.id} href={`/content/${p.id}`}>
                    <Card className="p-3 transition-colors hover:border-muted/40">
                      <div className="truncate text-sm font-medium">{p.title}</div>
                      <div className="mt-0.5 text-[0.7rem] text-muted">{p.contentType}</div>
                    </Card>
                  </Link>
                ))}
                {!items.length && (
                  <div className="px-2 py-3 text-center text-xs text-muted/60">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href="/content"
        className="text-sm font-medium text-accent hover:underline"
      >
        + Tạo bài mới trong Nội dung
      </Link>
    </div>
  );
}
