"use client";

import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/lib/use-api";
import { useMutation } from "@/lib/use-mutation";
import { useAuth } from "@/lib/auth";
import { resources } from "@/lib/resources";
import { isManager } from "@/lib/rbac";
import type { ProductLine } from "@/lib/types";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  ListSkeleton,
  PageHeader,
} from "@/components/ui";

export default function ProductLinesPage() {
  const { user } = useAuth();
  const canManage = isManager(user?.role);
  const { data, loading, error, reload } = useApi<ProductLine[]>(
    () => resources.productLines.list(),
    "product-lines",
  );
  const { run, busy } = useMutation();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  function create() {
    run(() => resources.productLines.create({ name, slug }), {
      success: `Đã tạo dòng sản phẩm "${name}"`,
      onSuccess: () => {
        setName("");
        setSlug("");
        setOpen(false);
        reload();
      },
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dòng sản phẩm"
        subtitle="Mỗi dòng sản phẩm gom chiến dịch, tri thức và giọng văn riêng."
        action={
          canManage && (
            <Button variant="primary" onClick={() => setOpen((o) => !o)}>
              Thêm dòng sản phẩm
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
              Lưu
            </Button>
          </form>
        </Card>
      )}

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <ListSkeleton rows={3} />
      ) : !data?.length ? (
        <EmptyState
          title="Chưa có dòng sản phẩm"
          hint={canManage ? "Tạo dòng sản phẩm đầu tiên để bắt đầu." : "Chưa có dòng sản phẩm nào được tạo."}
          action={
            canManage && (
              <Button variant="primary" onClick={() => setOpen(true)}>
                Tạo dòng sản phẩm
              </Button>
            )
          }
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
