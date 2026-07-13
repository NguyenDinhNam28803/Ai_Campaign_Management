"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApi } from "@/lib/use-api";
import { useMutation } from "@/lib/use-mutation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/toast";
import { resources } from "@/lib/resources";
import { isManager } from "@/lib/rbac";
import type { AIGeneration, ContentPiece, ContentVersion, VersionSource } from "@/lib/types";
import { ContentStatusBadge, JobStatusBadge } from "@/components/status";
import { DetailHeader } from "@/components/layout/detail-header";
import { Badge, Button, Card, ErrorState, Field, ListSkeleton, Textarea } from "@/components/ui";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SOURCE_TONE: Record<VersionSource, "neutral" | "accent" | "amber"> = {
  HUMAN_EDIT: "neutral",
  AI_DRAFT: "accent",
  AI_REFINE: "amber",
};

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const stopWatch = useRef(false);
  const canReview = isManager(user?.role);
  const canReopen = canReview || user?.role === "EDITOR";

  const piece = useApi<ContentPiece>(() => resources.content.get(id), `content:${id}`);
  const versions = useApi<ContentVersion[]>(() => resources.content.versions(id), `content:${id}:versions`);
  const { run, busy } = useMutation();

  const [editBody, setEditBody] = useState("");
  const [comment, setComment] = useState("");
  const [gen, setGen] = useState<AIGeneration | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setEditBody(piece.data?.currentVersion?.body ?? "");
  }, [piece.data?.currentVersionId, piece.data?.currentVersion?.body]);

  const reloadAll = () => {
    piece.reload();
    versions.reload();
  };

  async function generate() {
    setGenerating(true);
    setGen(null);
    stopWatch.current = false;
    try {
      const { generationId } = await resources.content.generate(id);
      for (let i = 0; i < 45 && !stopWatch.current; i++) {
        await sleep(i < 5 ? 1000 : i < 12 ? 3000 : 5000);
        if (stopWatch.current) break;
        const g = await resources.generations.get(generationId);
        setGen(g);
        if (g.status === "DONE") {
          toast("AI đã sinh xong bản nháp", "success");
          break;
        }
        if (g.status === "FAILED") {
          toast("AI sinh thất bại — xem chi tiết lỗi", "error");
          break;
        }
      }
      versions.reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi gọi AI", "error");
    } finally {
      setGenerating(false);
    }
  }

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

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/content"
        backLabel="Nội dung"
        title={p.title}
        subtitle={p.contentType}
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
                  v{p.currentVersion.versionNumber} · {p.currentVersion.source}
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
                    <Badge tone={SOURCE_TONE[v.source]}>{v.source}</Badge>
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

          <Card className="flex flex-col gap-3 p-4">
            <span className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">Trợ lý AI</span>
            <p className="text-xs text-muted">
              Sinh một bản nháp AI (AI_DRAFT) từ tiêu đề + nội dung hiện tại. Không đổi trạng thái.
            </p>
            <Button variant="primary" loading={generating} onClick={generate}>
              {generating ? "Đang sinh…" : "Generate AI"}
            </Button>
            {generating && (
              <button
                onClick={() => (stopWatch.current = true)}
                className="text-xs text-muted hover:text-accent"
              >
                Dừng theo dõi (job vẫn chạy nền)
              </button>
            )}
            <div aria-live="polite">
              {gen && (
                <div className="flex flex-col gap-1 rounded-md border border-muted/15 bg-paper px-3 py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Trạng thái</span>
                    <JobStatusBadge status={gen.status} />
                  </div>
                  {gen.status === "DONE" && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Chi phí</span>
                      <span className="font-mono">${gen.costUsd}</span>
                    </div>
                  )}
                  {gen.status === "FAILED" && (
                    <p className="text-[#b3462f]">
                      {gen.error?.includes("quota")
                        ? "Tài khoản OpenAI đã hết hạn mức. Liên hệ Admin để nạp thêm credit."
                        : gen.error?.includes("ngân sách")
                          ? gen.error
                          : "AI sinh thất bại. Thử lại sau ít phút."}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
