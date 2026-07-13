"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/toast";
import type { ProductLine } from "@/lib/types";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  ListSkeleton,
  PageHeader,
} from "@/components/ui";

export default function ProductLinesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";
  const { data, loading, reload } = useApi<ProductLine[]>("/product-lines");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/product-lines", { method: "POST", body: { name, slug } });
      toast(`Đã tạo dòng sản phẩm "${name}"`, "success");
      setName("");
      setSlug("");
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi tạo dòng sản phẩm", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dòng sản phẩm"
        subtitle="Mỗi dòng sản phẩm gom chiến dịch, tri thức và giọng văn riêng."
      />

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
        </Card>
      )}

      {loading ? (
        <ListSkeleton rows={3} />
      ) : !data?.length ? (
        <EmptyState
          title="Chưa có dòng sản phẩm"
          hint={canManage ? "Tạo dòng sản phẩm đầu tiên ở trên để bắt đầu." : "Chưa có dòng sản phẩm nào được tạo."}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((pl) => (
            <Link key={pl.id} href={`/product-lines/${pl.id}`}>
              <Card className="p-4 transition-colors hover:border-muted/40">
                <div className="font-medium">{pl.name}</div>
                <div className="mt-0.5 font-mono text-xs text-muted">{pl.slug}</div>
                <div className="mt-2 text-xs text-accent">Giọng văn →</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
