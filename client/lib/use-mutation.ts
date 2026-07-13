"use client";

import { useState } from "react";
import { useToast } from "@/components/toast";

/**
 * Gói mọi thao tác ghi: busy + error + toast thành công/thất bại.
 * Dùng: const { run, busy } = useMutation();
 *       run(() => resources.x.create(dto), { success: "Đã tạo", onSuccess: reload });
 */
export function useMutation() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(
    fn: () => Promise<T>,
    opts?: { success?: string; onSuccess?: (result: T) => void },
  ): Promise<T | undefined> {
    setBusy(true);
    setError(null);
    try {
      const result = await fn();
      if (opts?.success) toast(opts.success, "success");
      opts?.onSuccess?.(result);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Thao tác thất bại";
      setError(msg);
      toast(msg, "error");
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  return { run, busy, error };
}
