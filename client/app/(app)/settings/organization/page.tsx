"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/use-api";
import { useMutation } from "@/lib/use-mutation";
import { resources } from "@/lib/resources";
import type { Organization } from "@/lib/types";
import { Button, Card, ErrorState, Field, Input, ListSkeleton } from "@/components/ui";

export default function OrganizationSettingsPage() {
  const { data, loading, error, reload } = useApi<Organization>(
    () => resources.organization.get(),
    "org",
  );
  const { run, busy } = useMutation();

  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [model, setModel] = useState("");

  useEffect(() => {
    if (data) {
      setName(data.name);
      setBudget(String(data.monthlyAiBudgetUsd));
      setModel(data.defaultModel);
    }
  }, [data]);

  function save() {
    run(
      () =>
        resources.organization.update({
          name,
          monthlyAiBudgetUsd: Number(budget),
          defaultModel: model,
        }),
      { success: "Đã lưu cấu hình tổ chức", onSuccess: reload },
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading) return <ListSkeleton rows={1} />;

  return (
    <Card className="max-w-lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex flex-col gap-4"
      >
        <Field label="Tên tổ chức">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Ngân sách AI mỗi tháng (USD)">
          <Input type="number" min={0} step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} required />
        </Field>
        <p className="-mt-2 text-xs text-muted">
          Đặt 0 nghĩa là chưa cấp phép — mọi lệnh gọi AI sẽ bị chặn.
        </p>
        <Field label="Model mặc định">
          <Input value={model} onChange={(e) => setModel(e.target.value)} required />
        </Field>
        <div>
          <Button type="submit" variant="primary" loading={busy}>Lưu thay đổi</Button>
        </div>
      </form>
    </Card>
  );
}
