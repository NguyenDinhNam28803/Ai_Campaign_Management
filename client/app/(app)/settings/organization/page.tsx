"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useToast } from "@/components/toast";
import type { Organization } from "@/lib/types";
import { Button, Card, Field, Input, ListSkeleton } from "@/components/ui";

export default function OrganizationSettingsPage() {
  const toast = useToast();
  const { data, loading, reload } = useApi<Organization>("/organization");
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) {
      setName(data.name);
      setBudget(String(data.monthlyAiBudgetUsd));
      setModel(data.defaultModel);
    }
  }, [data]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/organization", {
        method: "PATCH",
        body: {
          name,
          monthlyAiBudgetUsd: Number(budget),
          defaultModel: model,
        },
      });
      toast("Đã lưu cấu hình tổ chức", "success");
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lưu thất bại", "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <ListSkeleton rows={1} />;

  return (
    <Card className="max-w-lg">
      <form onSubmit={save} className="flex flex-col gap-4">
        <Field label="Tên tổ chức">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Ngân sách AI mỗi tháng (USD)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
          />
        </Field>
        <p className="-mt-2 text-xs text-muted">
          Đặt 0 nghĩa là chưa cấp phép — mọi lệnh gọi AI sẽ bị chặn.
        </p>
        <Field label="Model mặc định">
          <Input value={model} onChange={(e) => setModel(e.target.value)} required />
        </Field>
        <div>
          <Button type="submit" variant="primary" loading={busy}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Card>
  );
}
