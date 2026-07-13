"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/toast";
import type { ProductLine, VoiceProfile } from "@/lib/types";
import {
  Button,
  Card,
  Field,
  Input,
  ListSkeleton,
  Textarea,
} from "@/components/ui";

export default function ProductLineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";
  const { data: pl, loading, reload } = useApi<ProductLine>(`/product-lines/${id}`);

  const [voice, setVoice] = useState<VoiceProfile>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof VoiceProfile, v: string) =>
    setVoice((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (pl?.voiceProfile) setVoice(pl.voiceProfile);
  }, [pl?.id, pl?.voiceProfile]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/product-lines/${id}`, {
        method: "PATCH",
        body: { voiceProfile: voice },
      });
      toast("Đã lưu giọng văn", "success");
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lưu thất bại", "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !pl) return <ListSkeleton rows={2} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/product-lines" className="text-sm text-muted hover:text-accent">
          ← Dòng sản phẩm
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{pl.name}</h1>
        <p className="mt-0.5 font-mono text-xs text-muted">{pl.slug}</p>
      </div>

      <Card className="max-w-2xl">
        <div className="mb-1 text-[0.72rem] font-medium uppercase tracking-wide text-muted">
          Giọng văn (Voice Profile)
        </div>
        <p className="mb-5 text-sm text-muted">
          Đây là thứ được đưa vào prompt khi AI viết bài cho dòng sản phẩm này —
          sửa ở đây thì AI sẽ viết khác đi.
        </p>
        <form onSubmit={save} className="flex flex-col gap-4">
          <Field label="Tông giọng">
            <Input
              value={voice.tone ?? ""}
              onChange={(e) => set("tone", e.target.value)}
              placeholder="Thân thiện, chuyên nghiệp, truyền cảm hứng…"
              disabled={!canManage}
            />
          </Field>
          <Field label="Đối tượng độc giả">
            <Input
              value={voice.audience ?? ""}
              onChange={(e) => set("audience", e.target.value)}
              placeholder="Dân văn phòng 25–35, quan tâm sức khỏe…"
              disabled={!canManage}
            />
          </Field>
          <Field label="Từ ngữ NÊN dùng">
            <Textarea
              rows={2}
              value={voice.do ?? ""}
              onChange={(e) => set("do", e.target.value)}
              disabled={!canManage}
            />
          </Field>
          <Field label="Từ ngữ KHÔNG nên dùng">
            <Textarea
              rows={2}
              value={voice.dont ?? ""}
              onChange={(e) => set("dont", e.target.value)}
              disabled={!canManage}
            />
          </Field>
          {canManage ? (
            <div>
              <Button type="submit" variant="primary" loading={busy}>
                Lưu giọng văn
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted">Chỉ ADMIN/MANAGER sửa được giọng văn.</p>
          )}
        </form>
      </Card>
    </div>
  );
}
