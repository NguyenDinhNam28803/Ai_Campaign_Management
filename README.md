# AI Content Platform

Công cụ **nội bộ** giúp team marketing của một công ty tự sản xuất nội dung (blog, social, email…) cho **nhiều dòng sản phẩm (ProductLine)**. AI là lớp tăng tốc, nhưng **con người luôn giữ chốt duyệt** (human-in-the-loop).

> Kho tài liệu thiết kế đầy đủ: [`TAI_LIEU_DU_AN_DAY_DU_1.md`](TAI_LIEU_DU_AN_DAY_DU_1.md).
> Sơ đồ kiến trúc tương tác: [`docs/diagrams/architecture.html`](docs/diagrams/architecture.html) (mở bằng trình duyệt).

---

## Tech stack

| Lớp | Lựa chọn |
|---|---|
| API / Worker | **NestJS 11** (TypeScript) |
| CSDL | **PostgreSQL + pgvector** (Supabase) qua **Prisma 6** |
| Hàng đợi | Redis + BullMQ *(từ P2)* |
| LLM | Provider interface — OpenAI / Claude / FPT AI *(từ P2)* |
| Auth | JWT + RBAC (4 role) |
| Frontend | Next.js *(sau)* |

## Trạng thái triển khai

| Phase | Nội dung | Trạng thái |
|---|---|:-:|
| **Setup** | Config, Prisma, migration, seed | ✅ |
| **P0** | Org · User · Auth/JWT · RBAC · ProductLine | ✅ |
| **P1** | Content workflow: Campaign · Content · versioning · duyệt | ✅ |
| **P2** | Generator async (BullMQ) + kiểm soát chi phí AI | ⏳ kế tiếp |
| **P3** | RAG + pipeline đa bước (pgvector) | ◻ |
| **P4** | Assistant SSE streaming | ◻ |
| **P5** | Publish + Outbox (đăng đa kênh) | ◻ |
| **P6** | Analytics feedback | ◻ |

## Cấu trúc thư mục

```
AI_Campaign/
├─ server/                 # NestJS API
│  ├─ prisma/
│  │  ├─ schema.prisma     # 14 bảng (5 nhóm)
│  │  ├─ migrations/       # migration + raw SQL (pgvector, index)
│  │  └─ seed.ts           # tạo Organization + admin
│  └─ src/
│     ├─ auth/             # JWT, RBAC (@Roles + guards)
│     ├─ users/            # quản lý người dùng (ADMIN)
│     ├─ organization/     # cấu hình + ngân sách AI
│     ├─ product-line/     # dòng sản phẩm
│     ├─ campaign/         # chiến dịch
│     ├─ content/          # bài viết + versioning + state machine
│     ├─ prisma/           # PrismaService (global)
│     ├─ config/           # validate biến môi trường
│     └─ health/           # GET /health
├─ docs/
│  ├─ superpowers/specs/   # tài liệu thiết kế từng phase
│  ├─ superpowers/plans/   # kế hoạch triển khai từng phase
│  └─ diagrams/            # sơ đồ HTML tương tác
└─ TAI_LIEU_DU_AN_DAY_DU_1.md
```

---

## Bắt đầu

### 1. Yêu cầu
- Node.js ≥ 20, npm
- Một project **Supabase** (PostgreSQL, đã bật extension `vector`)

### 2. Cấu hình môi trường
```bash
cd server
cp .env.example .env
```
Điền vào `.env` (lấy ở Supabase → **Connect** → tab **Prisma**):
- `DATABASE_URL` — Transaction pooler (`:6543`, có `?pgbouncer=true`) → runtime
- `DIRECT_URL` — Session pooler / Direct (`:5432`) → migrate/seed
- `JWT_SECRET` — chuỗi ngẫu nhiên dài
- `SEED_ORG_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`

### 3. Cài đặt & khởi tạo DB
```bash
npm install
npx prisma migrate deploy   # tạo 14 bảng + pgvector + index
npx prisma db seed          # tạo Organization + admin đầu tiên
```

### 4. Chạy
```bash
npm run start:dev           # watch mode
# hoặc
npm run start
```
Kiểm tra: `GET http://localhost:3000/health` → `{"status":"ok","db":"up"}`.

### 5. Test
```bash
npm test                          # unit (state machine, auth…)
npm run test:e2e                  # e2e trên Supabase (health/login/RBAC/vòng đời)
npm run build                     # biên dịch TypeScript
```

---

## API hiện có (P0 + P1)

Mọi endpoint (trừ `/health`, `/auth/login`) cần header `Authorization: Bearer <JWT>`.

### Auth & quản trị
| Method | Path | Quyền |
|---|---|---|
| `POST` | `/auth/login` | public |
| `GET` | `/auth/me` | đã đăng nhập |
| `GET/POST/PATCH/DELETE` | `/users` | ADMIN |
| `GET` · `PATCH` | `/organization` | đã đăng nhập · ADMIN |
| `GET/POST/PATCH/DELETE` | `/product-lines` | đọc: mọi role · ghi: ADMIN/MANAGER |

### Nội dung (P1)
| Method | Path | Quyền |
|---|---|---|
| `GET/POST/PATCH/DELETE` | `/campaigns` | đọc: mọi role · ghi: ADMIN/MANAGER |
| `POST` | `/content` | tạo (WRITER chỉ bài của mình) |
| `GET` | `/content` · `/content/:id` · `/content/:id/versions` | đã đăng nhập |
| `PATCH` | `/content/:id` | ownership |
| `POST` | `/content/:id/versions` | sửa nội dung (chỉ khi DRAFT) |
| `POST` | `/content/:id/submit` | tác giả / EDITOR+ |
| `POST` | `/content/:id/reviews` | **ADMIN/MANAGER** (duyệt) |
| `POST` | `/content/:id/reopen` | ADMIN/MANAGER/EDITOR |

### RBAC (4 role)
`ADMIN` (toàn quyền) · `MANAGER` (duyệt, quản campaign, xem cost) · `EDITOR` (tạo/sửa mọi nội dung) · `WRITER` (viết bài của mình).

### Vòng đời nội dung
```
DRAFT ⇄ IN_REVIEW → APPROVED → (SCHEDULED) → PUBLISHED → ARCHIVED
```
Không có đường tắt qua khâu duyệt — enforce bởi state machine tại
[`server/src/content/content-workflow.ts`](server/src/content/content-workflow.ts).

---

## Nguyên tắc phát triển
Mỗi phase đi theo chu trình **spec → plan → build → verify** (xem `docs/superpowers/`), commit thường xuyên, giữ human-in-the-loop, kiểm soát chi phí AI từ P2 trở đi.
