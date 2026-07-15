# AI Content Platform

> **Phiên bản:** `c493069` — 2026-07-15 10:32 +0700

Công cụ **nội bộ** giúp team marketing của một công ty tự sản xuất nội dung (blog, social, email…) cho **nhiều dòng sản phẩm (ProductLine)**. AI là lớp tăng tốc, nhưng **con người luôn giữ chốt duyệt** (human-in-the-loop).

> Kho tài liệu thiết kế đầy đủ: [`TAI_LIEU_DU_AN_DAY_DU_1.md`](TAI_LIEU_DU_AN_DAY_DU_1.md).
> Sơ đồ kiến trúc tương tác: [`docs/diagrams/architecture.html`](docs/diagrams/architecture.html) (mở bằng trình duyệt).

---

## Tech stack

| Lớp | Lựa chọn |
|---|---|
| API / Worker | **NestJS 11** (TypeScript) |
| CSDL | **PostgreSQL + pgvector** (Supabase) qua **Prisma 6** |
| Hàng đợi | Redis + BullMQ |
| LLM | Provider interface — **OpenAI** / **Ollama** (+ Claude / FPT AI mở rộng) |
| Auth | JWT + RBAC (4 role) |
| Frontend | **Next.js** (App Router, TypeScript) |
| AI Model | Python — fine-tune + inference (GGUF export) |

## Trạng thái triển khai

| Phase | Nội dung | Trạng thái |
|---|---|:-:|
| **Setup** | Config, Prisma, migration, seed | ✅ |
| **P0** | Org · User · Auth/JWT · RBAC · ProductLine | ✅ |
| **P1** | Content workflow: Campaign · Content · versioning · duyệt | ✅ |
| **P2** | Generator async (BullMQ) + kiểm soát chi phí AI | ✅ |
| **P3** | RAG + pipeline đa bước (pgvector) | ✅ |
| **P4** | Assistant SSE streaming | ✅ |
| **P5** | Publish + Outbox (đăng đa kênh) | ✅ |
| **P6** | Analytics feedback | ✅ |

## Cấu trúc thư mục

```
AI_Campaign/
├─ server/                    # NestJS API
│  ├─ prisma/
│  │  ├─ schema.prisma        # schema Prisma (20+ bảng)
│  │  ├─ migrations/          # migration + raw SQL (pgvector, index)
│  │  └─ seed.ts              # tạo Organization + admin
│  └─ src/
│     ├─ auth/                # JWT, RBAC (@Roles + guards)
│     ├─ users/               # quản lý người dùng (ADMIN)
│     ├─ organization/        # cấu hình + ngân sách AI
│     ├─ product-line/        # dòng sản phẩm
│     ├─ campaign/            # chiến dịch
│     ├─ content/             # bài viết + versioning + state machine
│     ├─ ai/                  # AI umbrella module
│     │  ├─ assistant/        # chat assistant (streaming, modes)
│     │  ├─ generation/       # content generation pipeline (BullMQ)
│     │  ├─ retrieval/        # RAG retrieval over knowledge base
│     │  ├─ budget/           # token/cost budget enforcement
│     │  └─ llm/              # LLM providers (OpenAI, Ollama)
│     ├─ analytics/           # CSV import + analytics dashboard
│     ├─ channel/             # publishing channel (encrypted credentials)
│     ├─ publish/             # outbox pattern + channel adapters
│     ├─ knowledge/           # knowledge base ingestion + chunking
│     ├─ queue/               # BullMQ queue module
│     ├─ prisma/              # PrismaService (global)
│     ├─ config/              # validate biến môi trường
│     └─ health/              # GET /health
├─ client/                    # Next.js App Router
│  ├─ app/
│  │  ├─ login/               # trang đăng nhập
│  │  ├─ api/assistant/       # assistant streaming endpoint
│  │  └─ (app)/               # nhóm route đã xác thực
│  │     ├─ dashboard/        # tổng quan
│  │     ├─ campaigns/        # quản lý chiến dịch
│  │     ├─ content/          # quản lý nội dung
│  │     ├─ channels/         # quản lý kênh xuất bản
│  │     ├─ product-lines/    # quản lý dòng sản phẩm
│  │     ├─ review/           # hàng đợi duyệt
│  │     ├─ analytics/        # dashboard analytics
│  │     ├─ ai-usage/         # token/AI usage
│  │     └─ settings/         # cài đặt org + users
│  ├─ components/
│  │  ├─ charts/              # bar, donut, line charts
│  │  ├─ assistant-panel.tsx  # chat panel AI
│  │  └─ ui/                  # button, card, table, toast...
│  └─ lib/
│     ├─ api.ts, auth.tsx     # API client + auth context
│     ├─ labels.ts, rbac.ts   # i18n labels + RBAC utils
│     ├─ query-store.ts       # cache/dedup query state
│     ├─ resources.ts, types.ts
│     └─ use-*.tsx            # hooks (assistant, generation, mutation)
├─ ai-model/                  # Python fine-tuning pipeline
│  ├─ train.py, inference.py  # training + inference scripts
│  ├─ merge_dataset.py        # dataset merge utility
│  ├─ export_gguf.py          # GGUF model export
│  ├─ dataset/                # 6 task datasets
│  └─ training_data.jsonl
├─ docs/
│  ├─ superpowers/specs/      # tài liệu thiết kế từng phase
│  ├─ superpowers/plans/      # kế hoạch triển khai từng phase
│  └─ diagrams/               # sơ đồ HTML tương tác
├─ skills/                    # Claude skills ecosystem (17 skills)
└─ TAI_LIEU_DU_AN_DAY_DU_1.md
```

---

## Bắt đầu

### 1. Yêu cầu
- Node.js ≥ 20, npm
- Python ≥ 3.11 (cho ai-model)
- Docker (tùy chọn — dùng `docker-compose.yml`)
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
- `OLLAMA_BASE_URL` — Ollama endpoint (mặc định: `http://localhost:11434`)
- `OPENAI_API_KEY` — OpenAI API key (nếu dùng OpenAI)

### 3. Cài đặt & khởi tạo DB
```bash
# Server
cd server && npm install
npx prisma migrate deploy   # tạo bảng + pgvector + index
npx prisma db seed          # tạo Organization + admin đầu tiên

# Client
cd ../client && npm install

# AI Model (tùy chọn)
cd ../ai-model && pip install -r requirements.txt
```

### 4. Chạy
```bash
# Server (watch mode)
cd server && npm run start:dev

# Client
cd client && npm run dev
```
Kiểm tra: `GET http://localhost:3000/health` → `{"status":"ok","db":"up"}`.

### 5. Test
```bash
cd server
npm test                          # unit (state machine, auth…)
npm run test:e2e                  # e2e trên Supabase
npm run build                     # biên dịch TypeScript

cd ../client
npm test                          # Vitest + RTL (query-store, rbac, labels)
```

---

## API hiện có (P0 – P6)

Mọi endpoint (trừ `/health`, `/auth/login`) cần header `Authorization: Bearer <JWT>`.

### Auth & quản trị
| Method | Path | Quyền |
|---|---|---|
| `POST` | `/auth/login` | public |
| `GET` | `/auth/me` | đã đăng nhập |
| `GET/POST/PATCH/DELETE` | `/users` | ADMIN |
| `GET` · `PATCH` | `/organization` | đã đăng nhập · ADMIN |
| `GET/POST/PATCH/DELETE` | `/product-lines` | đọc: mọi role · ghi: ADMIN/MANAGER |

### Nội dung
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

### AI
| Method | Path | Quyền |
|---|---|---|
| `POST` | `/ai/generate` | đã đăng nhập |
| `GET` | `/ai/generation/:id/status` | đã đăng nhập |
| `POST` | `/ai/assistant/chat` | đã đăng nhập (streaming) |
| `GET` | `/ai/budget` | ADMIN/MANAGER |

### Channel & Publish
| Method | Path | Quyền |
|---|---|---|
| `GET/POST/PATCH/DELETE` | `/channels` | ADMIN/MANAGER |
| `POST` | `/publish/:contentId` | ADMIN/MANAGER |
| `GET` | `/publications` | đã đăng nhập |

### Analytics
| Method | Path | Quyền |
|---|---|---|
| `POST` | `/analytics/import` | ADMIN/MANAGER |
| `GET` | `/analytics/dashboard` | đã đăng nhập |

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
Mỗi phase đi theo chu trình **spec → plan → build → verify** (xem `docs/superpowers/`), commit thường xuyên, giữ human-in-the-loop, kiểm soát chi phí AI từ P2 trở đi. Frontend dùng Vitest + RTL cho unit test, query-store pattern để quản lý cache/dedup, và labels.ts cho i18n đồng nhất.
