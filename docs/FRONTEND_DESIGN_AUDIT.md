# Frontend Design Audit — toàn bộ client

> Lăng kính: skill **frontend-design** (`skills/skills/frontend-design`). Ngày 2026-07-14.
> Brief pinned: `client/design.md` (Notion-Beige — calm, flat, 1 accent). Brief thắng; audit soi *chất lượng thực thi*, không đề xuất đổi palette trừ khi bạn muốn.

## Thang điểm nhanh (1–5)

| Tiêu chí frontend-design | Điểm | Ghi chú |
|---|:-:|---|
| Hero as thesis | 4 | Login đã là signature; các trang trong app thiếu "thesis" (ổn với admin) |
| Typography có cá tính | 3 | Mới dùng display ở Login; body/label tốt; thiếu nhịp cỡ chữ ở trang trong |
| Structure encodes truth | 4 | Eyebrow, badge, Kanban, table đúng ngữ nghĩa; numbered-markers không lạm dụng |
| Motion có chủ đích | 3.5 | Hover/ring/toast hợp lý; đã tôn trọng reduced-motion; chưa có moment orchestrated |
| Restraint / 1 signature | 4.5 | Dồn boldness vào Login, phần còn lại quiet — đúng tinh thần |
| Quality floor | 4 | Responsive + reduced-motion + keyboard rows ✅; còn vài chỗ a11y |
| Copy | 4.5 | Tiếng Việt hướng người dùng, active voice, empty/error có định hướng |
| Tránh "AI default" | 3 | Palette = default look #1 (kem+terracotta) — giữ theo brief, thực thi đã tránh cliché hero |

## Điểm mạnh (giữ)
- **Design system nhất quán**: tokens `ink/muted/accent/paper/surface`, radius, `components/ui/` tách file, re-export sạch.
- **Kiến trúc dữ liệu**: `resources` (endpoint typed) + `useApi(fetcher,key)` + `useMutation` + `ErrorState` — code giao diện gọn, xử lý lỗi/tải nhất quán.
- **RBAC ở UI** khớp backend; ngôn ngữ hướng người dùng; toast xác nhận hành động.
- **Signature**: Login hero display-type, calm, 1 accent.

## Phát hiện theo trang

| Trang | Nhận xét frontend-design | Ưu tiên |
|---|---|:-:|
| **/login** | ✅ Signature tốt. Có thể thêm micro-interaction nhẹ khi submit | thấp |
| **/dashboard** | Stat card + "cần chú ý" + "gần đây" tốt; **tiêu đề chưa dùng display**; "Gần đây" chưa có mốc thời gian tương đối | TB |
| **/content (bảng)** | Bảng có cấu trúc, row keyboard ✅; thiếu **cột người phụ trách/assignee** & **thời gian tương đối**; chưa có sort | TB |
| **/content/[id] (editor)** | Bố cục 3 vùng rõ; **editor là textarea thuần** (P4 mới cần WYSIWYG); panel AI tốt; thiếu diff AI↔người | thấp (chờ P4) |
| **/review** | Rõ mục đích; nên có **so sánh AI_DRAFT vs bản hiện tại** (tiêu chí tài liệu §8.2) | TB |
| **/campaigns/[id] (Kanban)** | Trực quan đúng state machine; cột tĩnh (chưa kéo-thả — hợp lý vì cần transition backend) | thấp |
| **/product-lines(+id)** | Card có icon; voice-profile editor rõ; ổn | thấp |
| **/ai-usage** | Ring + cảnh báo >80% tốt; breakdown chờ endpoint backend | thấp |
| **/settings/\*** | Tab rõ; form organization/users ổn; confirm xóa ✅ | thấp |

## Khoảng trống chung (áp frontend-design)
1. **Typography chưa "carry personality" ở trang trong.** design.md có `display 3.5rem` nhưng chỉ Login dùng. → cân nhắc dùng display (nhẹ hơn) cho 1–2 tiêu đề chính (Dashboard) để tạo nhịp — nhưng giữ "spend boldness in one place", đừng rải khắp.
2. **Thời gian tương đối** ("2 giờ trước") ở list/dashboard — tăng cảm giác "sống".
3. **A11y sâu hơn (U4 cũ)**: card điều hướng (product-line/campaign/review) bọc trong `<Link>` nên có focus, nhưng **stat card & Kanban card** cũng nên đảm bảo focus-visible rõ; kiểm `aria-current` cho nav active.
4. **Loading khớp layout**: dùng `ListSkeleton` chung; một số trang (dashboard, editor) nên có skeleton *đúng hình dạng* (stat card, 3-vùng) thay vì khối chung → CLS thấp hơn.
5. **Empty state có icon** ✅; có thể thêm 1 minh hoạ đặc trưng cho màn Editor rỗng.
6. **Motion**: cân nhắc 1 orchestrated moment duy nhất (vd stat card stagger-in ở Dashboard) — nhẹ, tôn trọng reduced-motion.

## Về "AI default" (Pass 2 của skill)
Palette hiện = **look mặc định #1** (kem + terracotta). Skill: *brief thắng* → giữ. Nếu sau này muốn app **không giống mặc định**, đây là quyết định thương hiệu: đổi `design.md` (vd nền trung tính lạnh hơn + accent khác, hoặc pair display-font khác Inter). Không bắt buộc.

## Khuyến nghị theo thứ tự (impact/effort)
1. **Thời gian tương đối** ở dashboard/content + **cột assignee** ở bảng content — impact vừa, effort thấp.
2. **Skeleton khớp hình dạng** cho dashboard & editor — impact vừa, effort thấp.
3. **/review so sánh version** (AI_DRAFT vs hiện tại) — impact cao cho adoption, effort TB (đọc versions đã có API).
4. **Display type ở Dashboard title** (một điểm) — impact thẩm mỹ, effort thấp.
5. (Tuỳ chọn) orchestrated stagger nhẹ ở Dashboard — impact thấp, effort thấp.
6. (Chiến lược) cân nhắc tiến hoá palette nếu muốn thoát "AI default".
