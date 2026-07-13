"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth";
import type { ProductLine } from "@/lib/types";
import { Button, Card, EmptyState, Field, Input, Spinner } from "@/components/ui";

export default function ProductLinesPage() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";
  const { data, loading, reload } = useApi<ProductLine[]>("/product-lines");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/product-lines", { method: "POST", body: { name, slug } });
      setName("");
      setSlug("");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tạo dòng sản phẩm");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Dòng sản phẩm</h1>
        <p className="mt-1 text-sm text-muted">
          Mỗi dòng sản phẩm gom chiến dịch, tri thức và kênh riêng.
        </p>
      </header>

      {canManage && (
        <Card>
          <form onSubmit={create} className="flex flex-wrap items-end gap-4">
            <div className="min-w-48 flex-1">
              <Field label="Tên">
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Cà phê Arabica" />
              </Field>
            </div>
            <div className="min-w-48 flex-1">
              <Field label="Slug">
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} required placeholder="ca-phe-arabica" />
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
        <EmptyState title="Chưa có dòng sản phẩm" hint="Tạo dòng sản phẩm đầu tiên ở trên." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((pl) => (
            <Card key={pl.id} className="p-4">
              <div className="font-medium">{pl.name}</div>
              <div className="mt-0.5 font-mono text-xs text-muted">{pl.slug}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
