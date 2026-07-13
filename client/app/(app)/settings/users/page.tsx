"use client";

import { useState } from "react";
import { useApi } from "@/lib/use-api";
import { useMutation } from "@/lib/use-mutation";
import { resources } from "@/lib/resources";
import type { Role, User } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  ListSkeleton,
  Select,
} from "@/components/ui";

const ROLES: Role[] = ["ADMIN", "MANAGER", "EDITOR", "WRITER"];

export default function UsersSettingsPage() {
  const { data, loading, error, reload } = useApi<User[]>(
    () => resources.users.list(),
    "users",
  );
  const { run, busy } = useMutation();

  const [form, setForm] = useState({ email: "", fullName: "", password: "", role: "WRITER" as Role });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function create() {
    run(() => resources.users.create(form), {
      success: `Đã thêm ${form.email}`,
      onSuccess: () => {
        setForm({ email: "", fullName: "", password: "", role: "WRITER" });
        reload();
      },
    });
  }

  function disable(u: User) {
    if (!window.confirm(`Vô hiệu hóa tài khoản ${u.email}? Người này sẽ không đăng nhập được.`)) return;
    run(() => resources.users.disable(u.id), { success: `Đã vô hiệu hóa ${u.email}`, onSuccess: reload });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
          className="flex flex-wrap items-end gap-4"
        >
          <div className="min-w-48 flex-1">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </Field>
          </div>
          <div className="min-w-40 flex-1">
            <Field label="Họ tên">
              <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
            </Field>
          </div>
          <div className="min-w-36">
            <Field label="Mật khẩu">
              <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required />
            </Field>
          </div>
          <div className="min-w-32">
            <Field label="Vai trò">
              <Select value={form.role} onChange={(e) => set("role", e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Button type="submit" variant="primary" loading={busy}>Thêm</Button>
        </form>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <ListSkeleton />
      ) : (
        <div className="flex flex-col gap-2">
          {data?.map((u) => (
            <Card key={u.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{u.fullName}</div>
                <div className="mt-0.5 text-xs text-muted">{u.email}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={u.role === "ADMIN" ? "accent" : "neutral"}>{u.role}</Badge>
                <Badge tone={u.status === "ACTIVE" ? "green" : "red"}>{u.status}</Badge>
                {u.status === "ACTIVE" && (
                  <Button variant="ghost" onClick={() => disable(u)}>Vô hiệu hóa</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
