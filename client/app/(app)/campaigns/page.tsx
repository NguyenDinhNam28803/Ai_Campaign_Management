"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/toast";
import type { Campaign, ProductLine } from "@/lib/types";
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
} from "@/components/ui";

export default function CampaignsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";
  const { data: pls } = useApi<ProductLine[]>("/product-lines");
  const { data, loading, reload } = useApi<Campaign[]>("/campaigns");

  const [productLineId, setProductLineId] = useState("");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);

  const plName = (id: string) => pls?.find((p) => p.id === id)?.name ?? "—";

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/campaigns", {
        method: "POST",
        body: { productLineId, name, goal: goal || undefined },
      });
      toast(`Đã tạo chiến dịch "${name}"`, "success");
      setName("");
      setGoal("");
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi tạo chiến dịch", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Chiến dịch" subtitle="Nhóm nội dung theo mục tiêu marketing." />

      {canManage && (
        <Card>
          <form onSubmit={create} className="flex flex-wrap items-end gap-4">
            <div className="min-w-52 flex-1">
              <Field label="Dòng sản phẩm">
                <Select value={productLineId} onChange={(e) => setProductLineId(e.target.value)} required>
                  <option value="">— chọn —</option>
                  {pls?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="min-w-48 flex-1">
              <Field label="Tên chiến dịch">
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
            </div>
            <div className="min-w-48 flex-1">
              <Field label="Mục tiêu (tùy chọn)">
                <Input value={goal} onChange={(e) => setGoal(e.target.value)} />
              </Field>
            </div>
            <Button type="submit" variant="primary" loading={busy}>
              Thêm
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <ListSkeleton />
      ) : !data?.length ? (
        <EmptyState
          title="Chưa có chiến dịch"
          hint={canManage ? "Tạo chiến dịch đầu tiên ở trên." : "Chưa có chiến dịch nào."}
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
