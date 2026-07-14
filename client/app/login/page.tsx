"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, Field, Icon, Input } from "@/components/ui";

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
    <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
      {/* Hero — signature: display type cỡ lớn, calm, 1 accent duy nhất ở logo-mark */}
      <section className="relative hidden flex-col justify-between border-r border-muted/15 px-14 py-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-white">
            <Icon name="sparkles" size={18} />
          </span>
          <span className="text-sm font-semibold tracking-tight">AI Content Platform</span>
        </div>

        <div className="max-w-xl">
          <div className="mb-5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted">
            Nội bộ · đa dòng sản phẩm
          </div>
          <h1 className="text-[clamp(2.5rem,4.5vw,3.5rem)] font-bold leading-[1.04] tracking-[-0.03em] text-ink text-balance">
            Sản xuất nội dung nhanh hơn.
            <br />
            Con người vẫn giữ quyết định.
          </h1>
          <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-muted">
            AI dựng nháp, gợi ý và truy hồi tri thức theo từng dòng sản phẩm — mọi bài
            vẫn qua tay người duyệt trước khi đăng.
          </p>
        </div>

        <dl className="flex gap-10 text-sm">
          <div>
            <dt className="font-mono text-2xl font-bold tracking-tight text-ink">RAG</dt>
            <dd className="text-xs text-muted">Giọng văn theo dòng SP</dd>
          </div>
          <div>
            <dt className="font-mono text-2xl font-bold tracking-tight text-ink">4</dt>
            <dd className="text-xs text-muted">Vai trò · duyệt có kiểm soát</dd>
          </div>
          <div>
            <dt className="font-mono text-2xl font-bold tracking-tight text-ink">$</dt>
            <dd className="text-xs text-muted">Minh bạch chi phí AI</dd>
          </div>
        </dl>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo gọn cho mobile (không có hero) */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-white">
              <Icon name="sparkles" size={18} />
            </span>
            <span className="text-sm font-semibold tracking-tight">AI Content Platform</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Đăng nhập</h2>
          <p className="mt-1 mb-7 text-sm text-muted">Chào mừng trở lại — tiếp tục công việc.</p>

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

            <Button type="submit" variant="primary" loading={busy} className="mt-1 w-full">
              Đăng nhập
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
