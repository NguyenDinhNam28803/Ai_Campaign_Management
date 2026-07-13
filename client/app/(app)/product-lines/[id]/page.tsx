"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/use-api";
import { useMutation } from "@/lib/use-mutation";
import { useAuth } from "@/lib/auth";
import { resources } from "@/lib/resources";
import { isManager } from "@/lib/rbac";
import type { ProductLine, VoiceProfile } from "@/lib/types";
import { DetailHeader } from "@/components/layout/detail-header";
import { Button, Card, ErrorState, Field, Input, ListSkeleton, Textarea } from "@/components/ui";

export default function ProductLineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canManage = isManager(user?.role);
  const { data: pl, loading, error, reload } = useApi<ProductLine>(
    () => resources.productLines.get(id),
    `product-line:${id}`,
  );
  const { run, busy } = useMutation();

  const [voice, setVoice] = useState<VoiceProfile>({});
  const set = (k: keyof VoiceProfile, v: string) => setVoice((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (pl?.voiceProfile) setVoice(pl.voiceProfile);
  }, [pl?.id, pl?.voiceProfile]);

  function save() {
    run(() => resources.productLines.update(id, { voiceProfile: voice }), {
      success: "Đã lưu giọng văn",
      onSuccess: reload,
    });
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !pl) return <ListSkeleton rows={2} />;

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        backHref="/product-lines"
        backLabel="Dòng sản phẩm"
        title={pl.name}
        subtitle={<span className="font-mono text-xs">{pl.slug}</span>}
      />

      <Card className="max-w-2xl">
        <div className="mb-1 text-[0.72rem] font-medium uppercase tracking-wide text-muted">
          Giọng văn (Voice Profile)
        </div>
        <p className="mb-5 text-sm text-muted">
          Đây là thứ được đưa vào prompt khi AI viết bài cho dòng sản phẩm này — sửa ở đây thì AI sẽ viết khác đi.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex flex-col gap-4"
        >
          <Field label="Tông giọng">
            <Input value={voice.tone ?? ""} onChange={(e) => set("tone", e.target.value)} placeholder="Thân thiện, chuyên nghiệp…" disabled={!canManage} />
          </Field>
          <Field label="Đối tượng độc giả">
            <Input value={voice.audience ?? ""} onChange={(e) => set("audience", e.target.value)} placeholder="Dân văn phòng 25–35…" disabled={!canManage} />
          </Field>
          <Field label="Từ ngữ NÊN dùng">
            <Textarea rows={2} value={voice.do ?? ""} onChange={(e) => set("do", e.target.value)} disabled={!canManage} />
          </Field>
          <Field label="Từ ngữ KHÔNG nên dùng">
            <Textarea rows={2} value={voice.dont ?? ""} onChange={(e) => set("dont", e.target.value)} disabled={!canManage} />
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
