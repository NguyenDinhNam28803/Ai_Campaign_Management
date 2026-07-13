"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useToast } from "@/components/toast";
import type { Role, User } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  ListSkeleton,
  Select,
} from "@/components/ui";

const ROLES: Role[] = ["ADMIN", "MANAGER", "EDITOR", "WRITER"];

export default function UsersSettingsPage() {
  const toast = useToast();
  const { data, loading, reload } = useApi<User[]>("/users");
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "WRITER" as Role,
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/users", { method: "POST", body: form });
      toast(`Đã thêm ${form.email}`, "success");
      setForm({ email: "", fullName: "", password: "", role: "WRITER" });
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Thêm thất bại", "error");
    } finally {
      setBusy(false);
    }
  }

  async function disable(u: User) {
    try {
      await api(`/users/${u.id}`, { method: "DELETE" });
      toast(`Đã vô hiệu hóa ${u.email}`, "success");
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Thao tác thất bại", "error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form onSubmit={create} className="flex flex-wrap items-end gap-4">
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
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Button type="submit" variant="primary" loading={busy}>
            Thêm
          </Button>
        </form>
      </Card>

      {loading ? (
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
                  <Button variant="ghost" onClick={() => disable(u)}>
                    Vô hiệu hóa
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
