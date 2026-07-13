"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, Card, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-1 text-[0.72rem] font-medium uppercase tracking-widest text-accent">
            AI Content Platform
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Đăng nhập</h1>
          <p className="mt-1 text-sm text-muted">Công cụ nội bộ · đa dòng sản phẩm</p>
        </div>

        <Card>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field label="Email">
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@company.com"
              />
            </Field>
            <Field label="Mật khẩu">
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <p className="rounded-md border border-[#b3462f]/20 bg-[#b3462f]/10 px-3 py-2 text-sm text-[#b3462f]">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" loading={busy} className="w-full">
              Đăng nhập
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
