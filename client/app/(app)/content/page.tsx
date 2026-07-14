"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApi } from "@/lib/use-api";
import { useMutation } from "@/lib/use-mutation";
import { resources } from "@/lib/resources";
import type { Campaign, ContentPiece, ContentType } from "@/lib/types";
import { CONTENT_TYPE_LABEL } from "@/lib/labels";
import { ContentStatusBadge } from "@/components/status";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  ListSkeleton,
  PageHeader,
  Select,
  Table,
  TableRowLink,
  Td,
  Textarea,
  Th,
} from "@/components/ui";

const TYPES: ContentType[] = ["BLOG", "SOCIAL", "EMAIL", "LANDING"];

export default function ContentListPage() {
  const campaigns = useApi<Campaign[]>(() => resources.campaigns.list(), "campaigns");
  const [filter, setFilter] = useState("");
  const { data, loading, error, reload } = useApi<ContentPiece[]>(
    () => resources.content.list({ campaignId: filter || undefined }),
    `content:${filter}`,
  );
  const { run, busy } = useMutation();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    campaignId: "",
    title: "",
    contentType: "BLOG" as ContentType,
    body: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const campaignName = useMemo(
    () => (id: string) => campaigns.data?.find((c) => c.id === id)?.name ?? "—",
    [campaigns.data],
  );
  const noCampaign = !campaigns.data?.length;

  function create() {
    run(() => resources.content.create(form), {
      success: `Đã tạo bài "${form.title}"`,
      onSuccess: () => {
        setForm({ campaignId: "", title: "", contentType: "BLOG", body: "" });
        setOpen(false);
        reload();
      },
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Nội dung"
        title="Bài viết"
        subtitle="Viết, duyệt và sinh nội dung bằng AI."
        action={
          <div className="flex items-center gap-3">
            <div className="w-52">
              <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">Tất cả chiến dịch</option>
                {campaigns.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap gap-4">
              <div className="min-w-52 flex-1">
                <Field label="Chiến dịch">
                  <Select value={form.campaignId} onChange={(e) => set("campaignId", e.target.value)} required>
                    <option value="">— chọn —</option>
                    {campaigns.data?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
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
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
            <Field label="Nội dung ban đầu">
              <Textarea rows={3} value={form.body} onChange={(e) => set("body", e.target.value)} required />
            </Field>
            <div>
              <Button type="submit" variant="primary" loading={busy}>Tạo bài</Button>
            </div>
          </form>
        </Card>
      )}

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <ListSkeleton />
      ) : noCampaign ? (
        <EmptyState
          icon="megaphone"
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
          icon="doc"
          title="Chưa có bài nào"
          hint="Tạo bài đầu tiên — viết tay hoặc để AI sinh nháp cho bạn."
          action={<Button variant="primary" onClick={() => setOpen(true)}>Viết bài đầu tiên</Button>}
        />
      ) : (
        <Table
          head={
            <>
              <Th>Tiêu đề</Th>
              <Th>Chiến dịch</Th>
              <Th>Loại</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right">Cập nhật</Th>
            </>
          }
        >
          {data.map((p) => (
            <TableRowLink key={p.id} href={`/content/${p.id}`} label={`Mở bài ${p.title}`}>
              <Td className="font-medium text-ink">{p.title}</Td>
              <Td className="text-muted">{campaignName(p.campaignId)}</Td>
              <Td>
                <Badge>{CONTENT_TYPE_LABEL[p.contentType]}</Badge>
              </Td>
              <Td>
                <ContentStatusBadge status={p.status} />
              </Td>
              <Td className="text-right text-xs text-muted">
                {new Date(p.updatedAt).toLocaleDateString("vi-VN")}
              </Td>
            </TableRowLink>
          ))}
        </Table>
      )}
    </div>
  );
}
