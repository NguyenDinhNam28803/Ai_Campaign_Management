"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useToast } from "@/components/toast";
import type { Campaign, ContentPiece, ContentType } from "@/lib/types";
import { ContentStatusBadge } from "@/components/status";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  ListSkeleton,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";

const TYPES: ContentType[] = ["BLOG", "SOCIAL", "EMAIL", "LANDING"];

export default function ContentListPage() {
  const toast = useToast();
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
  const [open, setOpen] = useState(false);
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const campaignName = useMemo(
    () => (id: string) => campaigns?.find((c) => c.id === id)?.name ?? "—",
    [campaigns],
  );

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/content", { method: "POST", body: form });
      toast(`Đã tạo bài "${form.title}"`, "success");
      setForm({ campaignId: "", title: "", contentType: "BLOG", body: "" });
      setOpen(false);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi tạo nội dung", "error");
    } finally {
      setBusy(false);
    }
  }

  const noCampaign = !campaigns?.length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Nội dung"
        subtitle="Viết, duyệt và sinh nội dung bằng AI."
        action={
          <div className="flex items-center gap-3">
            <div className="w-52">
              <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">Tất cả chiến dịch</option>
                {campaigns?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button variant="primary" onClick={() => setOpen((o) => !o)} disabled={noCampaign}>
              Viết bài
            </Button>
          </div>
        }
      />

      {open && (
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
            <div>
              <Button type="submit" variant="primary" loading={busy}>
                Tạo bài
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <ListSkeleton />
      ) : noCampaign ? (
        <EmptyState
          title="Chưa có chiến dịch nào"
          hint="Nội dung phải thuộc một chiến dịch. Tạo chiến dịch trước đã."
          action={
            <Link href="/campaigns">
              <Button variant="primary">Tạo chiến dịch</Button>
            </Link>
          }
        />
      ) : !data?.length ? (
        <EmptyState
          title="Chưa có bài nào"
          hint="Tạo bài đầu tiên — viết tay hoặc để AI sinh nháp cho bạn."
          action={
            <Button variant="primary" onClick={() => setOpen(true)}>
              Viết bài đầu tiên
            </Button>
          }
        />
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
