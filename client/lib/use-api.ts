"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * GET dữ liệu qua một fetcher (thường là resources.x.y()).
 * `key` là khóa phụ thuộc để reload khi tham số đổi. fetcher=null để bỏ qua.
 */
export function useApi<T>(fetcher: (() => Promise<T>) | null, key: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!fetcher) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetcher()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
