# Spec: Setup + P0 — Nền tảng & Auth (AI Content Platform)

> Sub-project đầu tiên của AI Content Platform (nội bộ, đa ProductLine).
> Tài liệu nguồn: `TAI_LIEU_DU_AN_DAY_DU_1.md`. Phạm vi ở đây chỉ gồm **Setup** và **Phase 0**.

## 1. Mục tiêu & Definition of Done

Dựng khung chạy được và lớp nền tảng auth/RBAC mà mọi phase sau (P1–P6) đứng lên trên.

**Definition of Done:**
1. `npm run build` (nest build) biên dịch sạch — cổng kiểm tra chính.
2. `docker compose up -d` khởi động Postgres (pgvector) + Redis.
3. `prisma migrate` + raw SQL (§16) + `prisma db seed` chạy thành công.
4. App boot: `GET /health` → 200; `POST /auth/login` với admin seed → trả JWT; RBAC guard chặn đúng role (sai role → 403).

## 2. Phạm vi

**Trong phạm vi:**
- Docker compose: `postgres` (image `pgvector/pgvector:pg16`) + `redis`.
- Cấu hình qua `@nestjs/config` với validation biến môi trường.
- Prisma: **toàn bộ 14 bảng** từ §15 + raw SQL §16 (extension vector, HNSW index, singleton index, partial soft-delete index).
- `prisma/seed.ts`: tạo Organization singleton + 1 user ADMIN từ env.
- Module P0: `PrismaModule`, `AuthModule` (JWT), RBAC (`@Roles` + `RolesGuard`), `UsersModule`, `OrganizationModule`, `ProductLineModule`, `HealthModule`.

**Ngoài phạm vi (các phase sau):**
- Next.js frontend.
- Logic Campaign/Content/AI/RAG/Publish/Analytics (bảng tồn tại nhưng không có logic).
- Redis consumer / BullMQ (Redis chỉ chạy trong compose cho hoàn chỉnh Setup).
- SSO/OIDC.

## 3. Hạ tầng (Setup)

- **`docker-compose.yml`** ở gốc repo:
  - `postgres`: `pgvector/pgvector:pg16`, volume bền, expose 5432, env POSTGRES_USER/PASSWORD/DB.
  - `redis`: `redis:7-alpine`, expose 6379.
- **`.env.example`** (và `.env` thực tế, git-ignored): `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ORG_NAME`.
- **ConfigModule** global, validate bằng schema (class-validator hoặc joi); app không boot nếu thiếu biến bắt buộc.

## 4. Cơ sở dữ liệu (Prisma)

- Schema đầy đủ 14 bảng theo §15 (Organization, User, ProductLine, Campaign, ContentPiece, ContentVersion, Review, AIGeneration, KnowledgeSource, KnowledgeChunk, Channel, Publication, OutboxEvent, MetricSnapshot) + toàn bộ enum.
- `previewFeatures = ["postgresqlExtensions"]`, `extensions = [vector]`.
- Prisma migrate tạo bảng; **một file SQL thủ công** bổ sung phần Prisma không diễn đạt được (§16):
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE INDEX knowledge_chunk_embedding_idx ON "KnowledgeChunk" USING hnsw (embedding vector_cosine_ops);
  CREATE UNIQUE INDEX organization_singleton_idx ON "Organization" ((true));
  CREATE INDEX content_piece_active_idx ON "ContentPiece" (product_line_id, status) WHERE deleted_at IS NULL;
  ```
  (Tên bảng/cột sẽ khớp với mapping Prisma thực tế khi generate — điều chỉnh theo `@@map`/tên mặc định.)
- `prisma/seed.ts`: upsert Organization singleton + upsert 1 ADMIN user (mật khẩu bcrypt-hash từ `SEED_ADMIN_PASSWORD`). Idempotent.

## 5. Module NestJS (code P0)

| Module | Nội dung | Quyền |
|---|---|---|
| `PrismaModule` | `PrismaService` (shared, global) | — |
| `HealthModule` | `GET /health` → 200, ping DB | Public |
| `AuthModule` | `POST /auth/login` (email+password → bcrypt verify → JWT), `GET /auth/me` | Public login; me = authenticated |
| RBAC | `@Roles(...)` decorator + `RolesGuard` (§19); `JwtAuthGuard` global + `@Public()` | — |
| `UsersModule` | CRUD user (create/list/update/disable), password hash bcrypt | ADMIN |
| `OrganizationModule` | `GET/PATCH /organization` (settings + AI budget) | ADMIN |
| `ProductLineModule` | CRUD; soft-delete `deletedAt` | Create/update/delete: ADMIN+MANAGER; list/read: mọi user đã đăng nhập |

**Auth flow:** JwtAuthGuard đăng ký global (APP_GUARD). `@Public()` bỏ qua cho `/health` và `/auth/login`. Payload JWT chứa `sub` (userId), `email`, `role`. RolesGuard chạy sau, đọc `user.role`.

## 6. Ma trận RBAC (§7 — enforce chính xác)

| Hành động | ADMIN | MANAGER | EDITOR | WRITER |
|---|:-:|:-:|:-:|:-:|
| Cấu hình org, người dùng | ✅ | ❌ | ❌ | ❌ |
| Quản lý ProductLine | ✅ | ✅ | ❌ | ❌ |
| Đăng nhập / xem thông tin bản thân | ✅ | ✅ | ✅ | ✅ |

(Các quyền Content/AI/Publish thuộc phase sau.)

## 7. Testing

- **Unit:** `RolesGuard` (cho qua/chặn theo role; endpoint không gắn @Roles → cho qua); `AuthService` (sai mật khẩu → Unauthorized; JWT payload đúng shape).
- **e2e happy path:** login lấy token → gọi route ADMIN-only bằng token WRITER → 403; bằng token ADMIN → 200; `/health` → 200 không cần token.

## 8. Verification (khớp yêu cầu "run build")

1. `npm run build` — biên dịch TypeScript sạch (cổng chính, luôn chạy được kể cả chưa có DB).
2. `docker compose up -d` → chờ Postgres healthy.
3. `npx prisma migrate dev` + apply raw SQL + `npx prisma db seed`.
4. `npm run start` → `curl /health` = 200; login admin seed = JWT; guard chặn sai role = 403.

## 9. Dependencies mới

`@prisma/client`, `prisma` (dev), `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@types/passport-jwt` (dev), `bcrypt`, `@types/bcrypt` (dev), `class-validator`, `class-transformer`.

## 10. Rủi ro & lưu ý

- pgvector: cần image có sẵn extension (dùng `pgvector/pgvector`), tránh cài thủ công.
- Raw SQL index đặt trong migration thủ công, không để Prisma tự sinh.
- Field `embedding Unsupported("vector(1536)")` — Prisma bỏ qua trong client type; không đụng ở P0.
- `Organization` là singleton — enforce bằng unique index `((true))`; code luôn `findFirst`.
