"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Campaign, ContentPiece, ContentType } from "@/lib/types";
import { ContentStatusBadge } from "@/components/status";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";

const TYPES: ContentType[] = ["BLOG", "SOCIAL", "EMAIL", "LANDING"];

export default function ContentListPage() {
  const { data: campaigns } = useApi<Campaign[]>("/campaigns");
  const [filter, setFilter] = useState("");
  const listPath = filter ? `/content?campaignId=${filter}` : "/content";
  const { data, loading, reload } = useApi<ContentPiece[]>(listPath);

  const [form, setForm] = useState({
    campaignId: "",
    title: "",
    contentType: "BLOG" as ContentType,
    body: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const campaignName = useMemo(
    () => (id: string) => campaigns?.find((c) => c.id === id)?.name ?? "—",
    [campaigns],
  );

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/content", { method: "POST", body: form });
      setForm({ campaignId: "", title: "", contentType: "BLOG", body: "" });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tạo nội dung");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nội dung</h1>
          <p className="mt-1 text-sm text-muted">Viết, duyệt và sinh nội dung bằng AI.</p>
        </div>
        <div className="w-56">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Tất cả chiến dịch</option>
            {campaigns?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </header>

      <Card>
        <form onSubmit={create} className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-52 flex-1">
              <Field label="Chiến dịch">
                <Select value={form.campaignId} onChange={(e) => set("campaignId", e.target.value)} required>
                  <option value="">— chọn —</option>
                  {campaigns?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="min-w-52 flex-[2]">
              <Field label="Tiêu đề">
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
              </Field>
            </div>
            <div className="min-w-36">
              <Field label="Loại">
                <Select value={form.contentType} onChange={(e) => set("contentType", e.target.value)}>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
          <Field label="Nội dung ban đầu">
            <Textarea rows={3} value={form.body} onChange={(e) => set("body", e.target.value)} required />
          </Field>
          <div className="flex items-center gap-4">
            <Button type="submit" variant="primary" loading={busy}>
              Tạo bài
            </Button>
            {error && <span className="text-sm text-[#b3462f]">{error}</span>}
          </div>
        </form>
      </Card>

      {loading ? (
        <Spinner />
      ) : !data?.length ? (
        <EmptyState title="Chưa có nội dung" hint="Tạo bài đầu tiên ở trên." />
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((p) => (
            <Link key={p.id} href={`/content/${p.id}`}>
              <Card className="flex items-center justify-between p-4 transition-colors hover:border-muted/40">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {campaignName(p.campaignId)} · {p.contentType}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{p.contentType}</Badge>
                  <ContentStatusBadge status={p.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
