# Frontend — Phân tích & Tái cấu trúc

> Ngày: 2026-07-13. Phạm vi: `client/` (Next.js 16 + Tailwind v4, design "Notion Beige").
> Nguyên tắc tái cấu trúc: **giữ nguyên hành vi + design**, chỉ nâng cấu trúc & lấp lỗ hổng UX. Build phải xanh.

## 1. Phân tích hiện trạng (trước)

### Điểm tốt (giữ nguyên)
- Design tokens sạch (Notion Beige), route group `(app)` + auth guard, toast/skeleton, RBAC ẩn nav theo role, ngôn ngữ hướng người dùng.

### Vấn đề cấu trúc code
| # | Vấn đề | Bằng chứng |
|---|---|---|
| C1 | Boilerplate mutation lặp (`setBusy/try/catch/toast/reload`) | 7 form |
| C2 | Endpoint magic-string rải rác | `api('/content')`… lặp nhiều trang |
| C3 | `ui.tsx` gộp 14 component/1 file (~260 dòng) | 1 file làm quá nhiều |
| C4 | Role-check lặp `role==='ADMIN'||'MANAGER'` | ~6 nơi |
| C5 | Lookup lặp (plName/campaignName) | 3 trang |
| C6 | Header detail tự chế (back-link) | 3 trang detail |

### Vấn đề UI/UX
| # | Vấn đề |
|---|---|
| U1 | **Lỗi tải dữ liệu bị nuốt** — `useApi.error` không được render ở bất kỳ trang nào (vi phạm UX-04) |
| U2 | Form tạo không nhất quán (toggle vs luôn-mở) |
| U3 | Đa accent trên 1 màn (lệch quy tắc 1-accent của design.md) |
| U4 | Card clickable thiếu affordance/focus |
| U5 | Xóa (vô hiệu user) không xác nhận |

## 2. Thay đổi đã thực hiện (sau)

### Tầng hạ tầng mới (`lib/`)
- **`lib/resources.ts`** — gom **mọi endpoint** thành hàm typed theo resource: `resources.content.create()`, `resources.productLines.list()`… → dứt magic-string (C2).
- **`lib/use-mutation.ts`** — `useMutation()` trả `{ run, busy, error }`, gói busy + toast thành công/thất bại + `onSuccess`. Thay ~7 khối try/catch (C1).
- **`lib/use-api.ts`** — đổi chữ ký sang `useApi(fetcher, key)`: nhận hàm fetcher (thường từ `resources`) + khóa reload, và **trả `error`** để trang render.
- **`lib/rbac.ts`** — `isAdmin()`, `isManager()`, `canManageContent()` thay role-check lặp (C4).

### Component
- **Tách `components/ui.tsx` → `components/ui/`**: `cn.ts · button.tsx · card.tsx · form.tsx · feedback.tsx · page-header.tsx` + `index.ts` re-export (C3). Import công khai `@/components/ui` **không đổi**.
- **`components/ui/feedback.tsx` thêm `ErrorState`** (message + nút "Thử lại") → lấp U1.
- **`components/layout/detail-header.tsx`** — `DetailHeader` dùng chung cho product-line/campaign/content detail (C6).

### Trang (rewrite, hành vi giữ nguyên)
- Mọi trang đọc dữ liệu giờ render **`ErrorState` khi `useApi.error`** + nút thử lại (U1).
- Mọi thao tác ghi dùng **`useMutation`** (C1).
- Danh sách (product-lines/campaigns/content) dùng **form toggle nhất quán**: nút chính "Thêm…" ở `PageHeader` mở form-card (U2); khi form mở, action chính của màn là nút Lưu (giảm đa-accent, U3).
- `settings/users`: **confirm trước khi vô hiệu hóa** (U5).
- Detail pages dùng `DetailHeader`; role-check qua `rbac`.

## 3. Cấu trúc sau tái cấu trúc

```
components/
  ui/            cn · button · card · form · feedback(+ErrorState) · page-header · index
  layout/        detail-header
  status.tsx · toast.tsx
lib/
  api.ts         (fetch client + token — giữ nguyên)
  resources.ts   (endpoint typed theo resource)
  use-api.ts     (useApi(fetcher, key) + error)
  use-mutation.ts
  rbac.ts
  auth.tsx · types.ts
app/
  layout · page · login · (app)/{layout, dashboard, content(+[id]), review,
  campaigns(+[id]), product-lines(+[id]), ai-usage, settings/*}
```

## 4. Kết quả
- `npm run build`: **sạch, 14 route**, TypeScript pass.
- Không đổi design/hành vi; giảm lặp code, lấp lỗ hổng lỗi-tải, đồng nhất form & header.

## 5. Còn tồn (phụ thuộc backend / phase sau)
- **S-03**: token đang ở `localStorage`; chuyển sang httpOnly cookie cần backend đổi auth.
- **U4**: focus-ring riêng cho card điều hướng bàn phím — cải thiện a11y sâu hơn sau.
- Trang P3–P6 (`/knowledge`, `/publications`, Assistant SSE…) chờ backend/tiến độ tương ứng. `resources.knowledge` đã typed sẵn cho khi dựng `/knowledge`.
