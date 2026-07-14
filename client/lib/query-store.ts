"use client";

// Store đọc dữ liệu tối giản: cache theo key + dedup request đang bay + chia sẻ
// kết quả giữa mọi component cùng key. Dùng useSyncExternalStore (chuẩn React
// cho external store) nên không setState-in-effect và an toàn khi unmount.

import { useCallback, useSyncExternalStore } from "react";

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface Entry {
  state: QueryState<unknown>;
  promise: Promise<void> | null;
  fetcher: (() => Promise<unknown>) | null;
  listeners: Set<() => void>;
}

const INITIAL_LOADING: QueryState<unknown> = { data: null, loading: true, error: null };
const INITIAL_IDLE: QueryState<unknown> = { data: null, loading: false, error: null };

const store = new Map<string, Entry>();

function getEntry(key: string): Entry {
  let e = store.get(key);
  if (!e) {
    e = { state: INITIAL_LOADING, promise: null, fetcher: null, listeners: new Set() };
    store.set(key, e);
  }
  return e;
}

function setState(e: Entry, next: Partial<QueryState<unknown>>) {
  e.state = { ...e.state, ...next };
  e.listeners.forEach((l) => l());
}

function runFetch(key: string, fetcher: () => Promise<unknown>, force = false): Promise<void> {
  const e = getEntry(key);
  e.fetcher = fetcher;
  if (e.promise && !force) return e.promise; // dedup: đã có request đang bay
  setState(e, { loading: true, ...(force ? { error: null } : {}) });
  const p = fetcher()
    .then((d) => setState(e, { data: d, error: null }))
    .catch((err) =>
      setState(e, { error: err instanceof Error ? err.message : "Lỗi tải dữ liệu" }),
    )
    .finally(() => {
      e.promise = null;
      setState(e, { loading: false });
    });
  e.promise = p;
  return p;
}

/**
 * Làm mới mọi query có key bắt đầu bằng `prefix`. Query đang được dùng thì
 * refetch, query không ai dùng thì xóa để lần mount sau lấy mới.
 */
export function invalidate(prefix: string) {
  store.forEach((e, key) => {
    if (!key.startsWith(prefix)) return;
    if (e.listeners.size && e.fetcher) runFetch(key, e.fetcher, true);
    else store.delete(key);
  });
}

/**
 * GET dữ liệu qua một fetcher (thường là resources.x.y()).
 * `key` định danh query để cache/dedup/chia sẻ. fetcher=null để bỏ qua.
 */
export function useApi<T>(fetcher: (() => Promise<T>) | null, key: string) {
  const active = !!fetcher;

  const subscribe = useCallback(
    (cb: () => void) => {
      if (!active) return () => {};
      const e = getEntry(key);
      e.listeners.add(cb);
      // Nạp lần đầu: chưa có dữ liệu/lỗi và không có request đang bay.
      if (e.state.data === null && e.state.error === null && !e.promise) {
        runFetch(key, fetcher as () => Promise<unknown>);
      }
      return () => {
        e.listeners.delete(cb);
      };
    },
    // fetcher cố tình bỏ khỏi deps: `key` là danh tính của query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, active],
  );

  const getSnapshot = useCallback(
    () => (active ? getEntry(key).state : INITIAL_IDLE) as QueryState<T>,
    [key, active],
  );

  const getServerSnapshot = useCallback(
    () => (active ? INITIAL_LOADING : INITIAL_IDLE) as QueryState<T>,
    [active],
  );

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const reload = useCallback(() => {
    if (fetcher) runFetch(key, fetcher as () => Promise<unknown>, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data: state.data, loading: state.loading, error: state.error, reload };
}
