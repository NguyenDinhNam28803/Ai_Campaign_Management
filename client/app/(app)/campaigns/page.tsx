"use client";

import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/lib/use-api";
import { useMutation } from "@/lib/use-mutation";
import { useAuth } from "@/lib/auth";
import { resources } from "@/lib/resources";
import { isManager } from "@/lib/rbac";
import type { Campaign, ProductLine } from "@/lib/types";
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
} from "@/components/ui";

export default function CampaignsPage() {
  const { user } = useAuth();
  const canManage = isManager(user?.role);
  const pls = useApi<ProductLine[]>(() => resources.productLines.list(), "product-lines");
  const { data, loading, error, reload } = useApi<Campaign[]>(
    () => resources.campaigns.list(),
    "campaigns",
  );
  const { run, busy } = useMutation();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productLineId: "", name: "", goal: "" });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const plName = (id: string) => pls.data?.find((p) => p.id === id)?.name ?? "—";

  function create() {
    run(
      () =>
        resources.campaigns.create({
          productLineId: form.productLineId,
          name: form.name,
          goal: form.goal || undefined,
        }),
      {
        success: `Đã tạo chiến dịch "${form.name}"`,
        onSuccess: () => {
          setForm({ productLineId: "", name: "", goal: "" });
          setOpen(false);
          reload();
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Chiến dịch"
        subtitle="Nhóm nội dung theo mục tiêu marketing."
        action={
          canManage && (
            <Button variant="primary" onClick={() => setOpen((o) => !o)}>
              Thêm chiến dịch
            </Button>
          )
        }
      />

      {open && canManage && (
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
            className="flex flex-wrap items-end gap-4"
          >
            <div className="min-w-52 flex-1">
              <Field label="Dòng sản phẩm">
                <Select value={form.productLineId} onChange={(e) => set("productLineId", e.target.value)} required>
                  <option value="">— chọn —</option>
                  {pls.data?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="min-w-48 flex-1">
              <Field label="Tên chiến dịch">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </Field>
            </div>
            <div className="min-w-48 flex-1">
              <Field label="Mục tiêu (tùy chọn)">
                <Input value={form.goal} onChange={(e) => set("goal", e.target.value)} />
              </Field>
            </div>
            <Button type="submit" variant="primary" loading={busy}>Lưu</Button>
          </form>
        </Card>
      )}

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <ListSkeleton />
      ) : !data?.length ? (
        <EmptyState
          title="Chưa có chiến dịch"
          hint={canManage ? "Tạo chiến dịch đầu tiên để bắt đầu." : "Chưa có chiến dịch nào."}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((c) => (
            <Link key={c.id} href={`/campaigns/${c.id}`}>
              <Card className="flex items-center justify-between p-4 transition-colors hover:border-muted/40">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {plName(c.productLineId)}
                    {c.goal ? ` · ${c.goal}` : ""}
                  </div>
                </div>
                <Badge>{c.status}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
