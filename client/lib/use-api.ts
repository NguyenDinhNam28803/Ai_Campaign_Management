// useApi giờ dựa trên query-store (cache + dedup + chia sẻ theo key).
// Giữ đường import cũ `@/lib/use-api` cho mọi call-site.
export { useApi, invalidate } from "./query-store";
