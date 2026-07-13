"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/toast";
import type {
  AIGeneration,
  ContentPiece,
  ContentVersion,
  VersionSource,
} from "@/lib/types";
import { ContentStatusBadge, JobStatusBadge } from "@/components/status";
import { Badge, Button, Card, Field, Spinner, Textarea } from "@/components/ui";

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
  const role = user?.role;
  const canReview = role === "ADMIN" || role === "MANAGER";
  const canReopen = canReview || role === "EDITOR";

  const { data: piece, loading, reload: reloadPiece } =
    useApi<ContentPiece>(`/content/${id}`);
  const { data: versions, reload: reloadVersions } =
    useApi<ContentVersion[]>(`/content/${id}/versions`);

  const [editBody, setEditBody] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gen, setGen] = useState<AIGeneration | null>(null);
  const [generating, setGenerating] = useState(false);

  // Đồng bộ ô soạn với bản hiện hành khi tải xong.
  useEffect(() => {
    setEditBody(piece?.currentVersion?.body ?? "");
  }, [piece?.currentVersionId, piece?.currentVersion?.body]);

  const reloadAll = () => {
    reloadPiece();
    reloadVersions();
  };

  async function act(fn: () => Promise<unknown>, successMsg?: string) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      if (successMsg) toast(successMsg, "success");
      reloadAll();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Thao tác thất bại";
      setError(msg);
      toast(msg, "error");
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    setGen(null);
    stopWatch.current = false;
    try {
      const { generationId } = await api<{ generationId: string }>(
        `/content/${id}/generate`,
        { method: "POST" },
      );
      // Polling thích ứng: nhanh lúc đầu rồi giãn dần, tránh đốt request.
      for (let i = 0; i < 45 && !stopWatch.current; i++) {
        await sleep(i < 5 ? 1000 : i < 12 ? 3000 : 5000);
        if (stopWatch.current) break;
        const g = await api<AIGeneration>(`/generations/${generationId}`);
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
      reloadVersions();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi gọi AI";
      setError(msg);
      toast(msg, "error");
    } finally {
      setGenerating(false);
    }
  }

  if (loading || !piece) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        <Spinner />
      </div>
    );
  }

  const isDraft = piece.status === "DRAFT";
  const isReview = piece.status === "IN_REVIEW";
  const isApproved = piece.status === "APPROVED";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/content" className="text-sm text-muted hover:text-accent">
          ← Nội dung
        </Link>
        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{piece.title}</h1>
          <ContentStatusBadge status={piece.status} />
        </div>
        <p className="mt-1 text-sm text-muted">{piece.contentType}</p>
      </div>

      {error && (
        <p className="rounded-md border border-[#b3462f]/20 bg-[#b3462f]/10 px-3 py-2 text-sm text-[#b3462f]">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main */}
        <div className="flex flex-col gap-6">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
                {isDraft ? "Soạn nội dung" : "Bản hiện hành"}
              </span>
              {piece.currentVersion && (
                <Badge tone={SOURCE_TONE[piece.currentVersion.source]}>
                  v{piece.currentVersion.versionNumber} · {piece.currentVersion.source}
                </Badge>
              )}
            </div>
            {isDraft ? (
              <div className="flex flex-col gap-3">
                <Textarea
                  rows={14}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                />
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    loading={busy}
                    onClick={() =>
                      act(
                        () =>
                          api(`/content/${id}/versions`, {
                            method: "POST",
                            body: { body: editBody },
                          }),
                        "Đã lưu bản mới",
                      )
                    }
                  >
                    Lưu bản mới
                  </Button>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {piece.currentVersion?.body}
              </div>
            )}
          </Card>

          {/* Lịch sử phiên bản */}
          <Card>
            <div className="mb-3 text-[0.72rem] font-medium uppercase tracking-wide text-muted">
              Lịch sử phiên bản
            </div>
            <div className="flex flex-col divide-y divide-muted/10">
              {versions?.map((v) => (
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

        {/* Rail actions */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-4">
            <span className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
              Quy trình
            </span>

            {isDraft && (
              <Button
                variant="primary"
                loading={busy}
                onClick={() =>
                  act(() => api(`/content/${id}/submit`, { method: "POST" }), "Đã gửi duyệt")
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
                    act(async () => {
                      await api(`/content/${id}/reviews`, {
                        method: "POST",
                        body: { decision: "APPROVED", comment: comment || undefined },
                      });
                      setComment("");
                    }, "Đã duyệt bài")
                  }
                >
                  Duyệt
                </Button>
                <Button
                  variant="secondary"
                  loading={busy}
                  onClick={() =>
                    act(async () => {
                      await api(`/content/${id}/reviews`, {
                        method: "POST",
                        body: { decision: "CHANGES_REQUESTED", comment: comment || undefined },
                      });
                      setComment("");
                    }, "Đã yêu cầu sửa — bài về lại Nháp")
                  }
                >
                  Yêu cầu sửa
                </Button>
              </>
            )}

            {isReview && !canReview && (
              <p className="text-sm text-muted">Đang chờ Manager duyệt.</p>
            )}

            {isApproved && canReopen && (
              <Button
                variant="secondary"
                loading={busy}
                onClick={() =>
                  act(() => api(`/content/${id}/reopen`, { method: "POST" }), "Đã mở lại để sửa")
                }
              >
                Mở lại (sửa tiếp)
              </Button>
            )}
          </Card>

          {/* AI generate */}
          <Card className="flex flex-col gap-3 p-4">
            <span className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
              Trợ lý AI
            </span>
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
