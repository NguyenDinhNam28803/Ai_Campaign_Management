"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth";
import type { Campaign, ProductLine } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  Spinner,
} from "@/components/ui";

export default function CampaignsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";
  const { data: pls } = useApi<ProductLine[]>("/product-lines");
  const { data, loading, reload } = useApi<Campaign[]>("/campaigns");

  const [productLineId, setProductLineId] = useState("");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plName = (id: string) => pls?.find((p) => p.id === id)?.name ?? "—";

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/campaigns", {
        method: "POST",
        body: { productLineId, name, goal: goal || undefined },
      });
      setName("");
      setGoal("");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tạo chiến dịch");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Chiến dịch</h1>
        <p className="mt-1 text-sm text-muted">Nhóm nội dung theo mục tiêu marketing.</p>
      </header>

      {canManage && (
        <Card>
          <form onSubmit={create} className="flex flex-wrap items-end gap-4">
            <div className="min-w-52 flex-1">
              <Field label="Dòng sản phẩm">
                <Select
                  value={productLineId}
                  onChange={(e) => setProductLineId(e.target.value)}
                  required
                >
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
          {error && <p className="mt-3 text-sm text-[#b3462f]">{error}</p>}
        </Card>
      )}

      {loading ? (
        <Spinner />
      ) : !data?.length ? (
        <EmptyState title="Chưa có chiến dịch" hint="Tạo chiến dịch đầu tiên ở trên." />
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((c) => (
            <Card key={c.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="mt-0.5 text-xs text-muted">
                  {plName(c.productLineId)}
                  {c.goal ? ` · ${c.goal}` : ""}
                </div>
              </div>
              <Badge>{c.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
