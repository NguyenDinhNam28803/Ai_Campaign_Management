import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useApi } from "./query-store";

// Key riêng mỗi test để tránh cache dùng chung giữa các test (store ở module).
const uniqueKey = (p: string) => `${p}-${Math.random().toString(36).slice(2)}`;

describe("query-store useApi", () => {
  it("dedup: hai component cùng key chỉ fetch một lần", async () => {
    const fetcher = vi.fn().mockResolvedValue("X");
    const key = uniqueKey("dedup");
    const a = renderHook(() => useApi(() => fetcher(), key));
    const b = renderHook(() => useApi(() => fetcher(), key));

    await waitFor(() => expect(a.result.current.data).toBe("X"));
    expect(b.result.current.data).toBe("X");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("reload gọi fetcher lại và cập nhật dữ liệu", async () => {
    let n = 0;
    const key = uniqueKey("reload");
    const { result } = renderHook(() => useApi(() => Promise.resolve(++n), key));

    await waitFor(() => expect(result.current.data).toBe(1));
    await act(async () => {
      result.current.reload();
    });
    await waitFor(() => expect(result.current.data).toBe(2));
  });

  it("lỗi được đưa vào error, loading về false", async () => {
    const key = uniqueKey("err");
    const { result } = renderHook(() =>
      useApi(() => Promise.reject(new Error("boom")), key),
    );

    await waitFor(() => expect(result.current.error).toBe("boom"));
    expect(result.current.loading).toBe(false);
  });

  it("fetcher null => idle, không loading", () => {
    const { result } = renderHook(() => useApi(null, uniqueKey("null")));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
