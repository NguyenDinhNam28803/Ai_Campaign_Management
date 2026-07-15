"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/use-api";
import { useMutation } from "@/lib/use-mutation";
import { useAuth } from "@/lib/auth";
import { resources } from "@/lib/resources";
import { isManager } from "@/lib/rbac";
import type { ContentPiece, ContentVersion, Channel, Publication, VersionSource } from "@/lib/types";
import { CONTENT_TYPE_LABEL, VERSION_SOURCE_LABEL, CHANNEL_TYPE_LABEL, PUBLISH_STATUS_LABEL } from "@/lib/labels";
import { ContentStatusBadge } from "@/components/status";
import { DetailHeader } from "@/components/layout/detail-header";
import { AssistantPanel } from "@/components/assistant-panel";
import { Badge, Button, Card, ErrorState, Field, ListSkeleton, Textarea } from "@/components/ui";

const SOURCE_TONE: Record<VersionSource, "neutral" | "accent" | "amber"> = {
  HUMAN_EDIT: "neutral",
  AI_DRAFT: "accent",
  AI_REFINE: "amber",
};

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canReview = isManager(user?.role);
  const canReopen = canReview || user?.role === "EDITOR";

  const piece = useApi<ContentPiece>(() => resources.content.get(id), `content:${id}`);
  const versions = useApi<ContentVersion[]>(() => resources.content.versions(id), `content:${id}:versions`);
  const channels = useApi<Channel[]>(() => resources.channels.list(piece.data?.productLineId), `channels:${piece.data?.productLineId}`);
  const publications = useApi<Publication[]>(() => resources.publications.list({ pieceId: id }), `publications:${id}`);
  const { run, busy } = useMutation();

  const [editBody, setEditBody] = useState("");
  const [comment, setComment] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");

  useEffect(() => {
    setEditBody(piece.data?.currentVersion?.body ?? "");
  }, [piece.data?.currentVersionId, piece.data?.currentVersion?.body]);

  const reloadAll = () => {
    piece.reload();
    versions.reload();
  };

  if (piece.error) return <ErrorState message={piece.error} onRetry={piece.reload} />;
  if (piece.loading || !piece.data)
    return (
      <div className="py-20">
        <ListSkeleton rows={3} />
      </div>
    );

  const p = piece.data;
  const isDraft = p.status === "DRAFT";
  const isReview = p.status === "IN_REVIEW";
  const isApproved = p.status === "APPROVED";
  const isScheduled = p.status === "SCHEDULED";
  const canPublish = (isApproved || isScheduled) && canReview;

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/content"
        backLabel="Nội dung"
        title={p.title}
        subtitle={CONTENT_TYPE_LABEL[p.contentType]}
        right={<ContentStatusBadge status={p.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main */}
        <div className="flex flex-col gap-6">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
                {isDraft ? "Soạn nội dung" : "Bản hiện hành"}
              </span>
              {p.currentVersion && (
                <Badge tone={SOURCE_TONE[p.currentVersion.source]}>
                  v{p.currentVersion.versionNumber} · {VERSION_SOURCE_LABEL[p.currentVersion.source]}
                </Badge>
              )}
            </div>
            {isDraft ? (
              <div className="flex flex-col gap-3">
                <Textarea rows={14} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    loading={busy}
                    onClick={() =>
                      run(() => resources.content.addVersion(id, editBody), {
                        success: "Đã lưu bản mới",
                        onSuccess: reloadAll,
                      })
                    }
                  >
                    Lưu bản mới
                  </Button>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{p.currentVersion?.body}</div>
            )}
          </Card>

          <Card>
            <div className="mb-3 text-[0.72rem] font-medium uppercase tracking-wide text-muted">
              Lịch sử phiên bản
            </div>
            <div className="flex flex-col divide-y divide-muted/10">
              {versions.data?.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">v{v.versionNumber}</span>
                    <Badge tone={SOURCE_TONE[v.source]}>{VERSION_SOURCE_LABEL[v.source]}</Badge>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(v.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Rail */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-4">
            <span className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">Quy trình</span>

            {isDraft && (
              <Button
                variant="primary"
                loading={busy}
                onClick={() =>
                  run(() => resources.content.submit(id), { success: "Đã gửi duyệt", onSuccess: reloadAll })
                }
              >
                Gửi duyệt
              </Button>
            )}

            {isReview && canReview && (
              <>
                <Field label="Nhận xét (tùy chọn)">
                  <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
                </Field>
                <Button
                  variant="primary"
                  loading={busy}
                  onClick={() =>
                    run(() => resources.content.review(id, "APPROVED", comment || undefined), {
                      success: "Đã duyệt bài",
                      onSuccess: () => {
                        setComment("");
                        reloadAll();
                      },
                    })
                  }
                >
                  Duyệt
                </Button>
                <Button
                  variant="secondary"
                  loading={busy}
                  onClick={() =>
                    run(() => resources.content.review(id, "CHANGES_REQUESTED", comment || undefined), {
                      success: "Đã yêu cầu sửa — bài về lại Nháp",
                      onSuccess: () => {
                        setComment("");
                        reloadAll();
                      },
                    })
                  }
                >
                  Yêu cầu sửa
                </Button>
              </>
            )}

            {isReview && !canReview && <p className="text-sm text-muted">Đang chờ Manager duyệt.</p>}

            {isApproved && canReopen && (
              <Button
                variant="secondary"
                loading={busy}
                onClick={() =>
                  run(() => resources.content.reopen(id), { success: "Đã mở lại để sửa", onSuccess: reloadAll })
                }
              >
                Mở lại (sửa tiếp)
              </Button>
            )}
          </Card>

          {isDraft && (
            <AssistantPanel
              pieceId={id}
              currentText={editBody}
              onApply={(newText) => {
                setEditBody(newText);
                run(() => resources.content.addVersion(id, newText), {
                  success: "Đã áp dụng và lưu bản mới",
                  onSuccess: reloadAll,
                });
              }}
            />
          )}

          {/* Publish section */}
          {canPublish && (
            <Card className="flex flex-col gap-3 p-4">
              <span className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
                Đăng bài
              </span>
              <Field label="Chọn kênh">
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full rounded-md border border-muted/20 bg-surface px-3 py-2 text-sm"
                >
                  <option value="">Chọn kênh đăng bài</option>
                  {channels.data?.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name} ({CHANNEL_TYPE_LABEL[ch.type]})
                    </option>
                  ))}
                </select>
              </Field>
              <Button
                variant="primary"
                loading={busy}
                disabled={!selectedChannel}
                onClick={() =>
                  run(
                    () =>
                      resources.publications.create({
                        pieceId: id,
                        channelId: selectedChannel,
                      }),
                    {
                      success: "Đã tạo yêu cầu đăng bài",
                      onSuccess: () => {
                        setSelectedChannel("");
                        publications.reload();
                      },
                    },
                  )
                }
              >
                Đăng ngay
              </Button>
            </Card>
          )}

          {/* Publications list */}
          {publications.data && publications.data.length > 0 && (
            <Card className="flex flex-col gap-3 p-4">
              <span className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
                Lịch sử đăng bài
              </span>
              <div className="flex flex-col gap-2">
                {publications.data.map((pub) => (
                  <div
                    key={pub.id}
                    className="flex items-center justify-between rounded-md border border-muted/15 bg-paper px-3 py-2 text-xs"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">
                        {pub.channel?.name ?? "Kênh"}
                      </span>
                      <span className="text-muted">
                        {CHANNEL_TYPE_LABEL[pub.channel?.type ?? "WORDPRESS"]}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <Badge
                        tone={
                          pub.status === "LIVE"
                            ? "accent"
                            : pub.status === "FAILED"
                              ? "neutral"
                              : "amber"
                        }
                      >
                        {PUBLISH_STATUS_LABEL[pub.status]}
                      </Badge>
                      {pub.externalUrl && (
                        <a
                          href={pub.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline"
                        >
                          Xem bài viết
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
