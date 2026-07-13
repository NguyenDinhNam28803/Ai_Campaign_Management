"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Role, User } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Select,
  Spinner,
} from "@/components/ui";

const ROLES: Role[] = ["ADMIN", "MANAGER", "EDITOR", "WRITER"];

export default function UsersPage() {
  const { data, loading, reload } = useApi<User[]>("/users");
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "WRITER" as Role,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/users", { method: "POST", body: form });
      setForm({ email: "", fullName: "", password: "", role: "WRITER" });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tạo người dùng");
    } finally {
      setBusy(false);
    }
  }

  async function disable(id: string) {
    await api(`/users/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Người dùng</h1>
        <p className="mt-1 text-sm text-muted">Chỉ ADMIN quản lý tài khoản nội bộ.</p>
      </header>

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
        {error && <p className="mt-3 text-sm text-[#b3462f]">{error}</p>}
      </Card>

      {loading ? (
        <Spinner />
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
                  <Button variant="ghost" onClick={() => disable(u.id)}>
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
