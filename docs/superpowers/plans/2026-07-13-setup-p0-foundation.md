# Setup + P0 (Nền tảng & Auth) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng khung chạy được (Docker + Prisma/pgvector + config) và lớp nền tảng Auth/RBAC (JWT, 4 role, Users/Organization/ProductLine) cho AI Content Platform.

**Architecture:** NestJS 11 monolith trong `server/`. PrismaService dùng chung, JwtAuthGuard đăng ký global với escape hatch `@Public()`, RolesGuard chạy sau đọc `user.role`. Toàn bộ 14 bảng migrate ngay ở P0; chỉ Org/User/ProductLine có logic.

**Tech Stack:** NestJS 11, Prisma + PostgreSQL (pgvector/pgvector:pg16), Redis (compose only), @nestjs/jwt + passport-jwt, bcrypt, class-validator.

## Global Constraints

- Node/NestJS 11, TypeScript strict (theo tsconfig hiện có).
- Một tổ chức, không multi-tenant, không RLS — phân quyền bằng RBAC ở app.
- `Organization` là singleton (unique index `((true))`), code luôn `findFirst`.
- Prisma default table/column naming = tên model/field (PascalCase/camelCase) — raw SQL §16 phải khớp naming này (không dùng snake_case trừ khi thêm `@@map`).
- Cổng verify chính: `npm run build` biên dịch sạch. DB verify qua docker compose.
- Mọi mật khẩu bcrypt-hash. JWT payload: `{ sub, email, role }`.

---

### Task 1: Config + Health (app boot được)

**Files:**
- Modify: `server/package.json` (deps)
- Create: `server/src/config/env.validation.ts`
- Modify: `server/src/app.module.ts`
- Create: `server/src/health/health.module.ts`, `server/src/health/health.controller.ts`
- Modify: `server/src/main.ts` (global ValidationPipe)
- Delete: `server/src/app.controller.ts`, `server/src/app.service.ts`, `server/src/app.controller.spec.ts`

**Interfaces:**
- Produces: `HealthController` (`GET /health` → `{ status: 'ok' }`), `AppModule` với `ConfigModule.forRoot({ isGlobal, validate })`.

- [ ] Cài deps: `npm i @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer @prisma/client` và `npm i -D prisma @types/passport-jwt @types/bcrypt`
- [ ] `env.validation.ts`: class `EnvironmentVariables` với class-validator (`DATABASE_URL` string, `JWT_SECRET` string, `JWT_EXPIRES_IN` default `1d`, `PORT` number default 3000, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ORG_NAME`) + hàm `validate(config)` dùng `plainToInstance` + `validateSync`, throw nếu lỗi.
- [ ] Xoá app.controller/service/spec mặc định; `app.module.ts` chỉ import `ConfigModule.forRoot({ isGlobal: true, validate })` + `HealthModule`.
- [ ] `health.controller.ts`: `@Public() @Get('health') check() { return { status: 'ok' }; }` (decorator @Public tạm là no-op tới Task 4; ở Task 1 chưa có guard nên bỏ @Public, thêm lại ở Task 5).
- [ ] `main.ts`: thêm `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))` và `app.setGlobalPrefix('api')` (tùy chọn — giữ đơn giản, KHÔNG dùng prefix để path khớp spec).
- [ ] Chạy `npm run build` → PASS. Chạy `npm start` → `curl localhost:3000/health` = `{"status":"ok"}`.
- [ ] Commit: `feat(setup): config validation + health endpoint`.

### Task 2: Docker compose + env

**Files:**
- Create: `docker-compose.yml` (root), `server/.env.example`, `server/.env`

- [ ] `docker-compose.yml`: service `postgres` image `pgvector/pgvector:pg16`, env POSTGRES_USER=app/POSTGRES_PASSWORD=app/POSTGRES_DB=ai_campaign, ports `5432:5432`, volume `pgdata`, healthcheck `pg_isready`. Service `redis` image `redis:7-alpine`, ports `6379:6379`.
- [ ] `.env.example` + `.env`: `DATABASE_URL="postgresql://app:app@localhost:5432/ai_campaign?schema=public"`, `JWT_SECRET="dev-secret-change-me"`, `JWT_EXPIRES_IN="1d"`, `PORT=3000`, `SEED_ADMIN_EMAIL="admin@company.com"`, `SEED_ADMIN_PASSWORD="Admin@12345"`, `SEED_ORG_NAME="My Company"`.
- [ ] `docker compose up -d` → `docker compose ps` cho thấy postgres healthy + redis up.
- [ ] Commit: `chore(setup): docker-compose postgres(pgvector)+redis, env example`.

### Task 3: Prisma schema (14 bảng) + migration + raw SQL + seed

**Files:**
- Create: `server/prisma/schema.prisma`, `server/prisma/seed.ts`
- Create: `server/src/prisma/prisma.service.ts`, `server/src/prisma/prisma.module.ts`
- Modify: `server/package.json` (prisma.seed config, script)

**Interfaces:**
- Produces: `PrismaService extends PrismaClient` (global module), toàn bộ model theo §15.

- [ ] `schema.prisma`: copy nguyên §15 (generator client + previewFeatures postgresqlExtensions, datasource extensions=[vector], toàn bộ enum + 14 model). Giữ tên field camelCase.
- [ ] `PrismaService`: `extends PrismaClient implements OnModuleInit { async onModuleInit(){ await this.$connect(); } }`; `PrismaModule` `@Global()` export PrismaService.
- [ ] `npx prisma generate`; `npx prisma migrate dev --name init` (tạo bảng). Kiểm tra migration tạo đủ 14 bảng.
- [ ] Thêm file raw SQL vào migration (hoặc migration thứ 2 `--create-only`): `CREATE EXTENSION IF NOT EXISTS vector;` + HNSW index trên `"KnowledgeChunk"(embedding)` + `CREATE UNIQUE INDEX organization_singleton_idx ON "Organization" ((true));` + partial index `"ContentPiece"(productLineId, status) WHERE "deletedAt" IS NULL`. Dùng đúng tên cột camelCase Prisma sinh ra (verify bằng `\d "ContentPiece"`). Apply bằng `prisma migrate dev`.
- [ ] `seed.ts`: `new PrismaClient()`; upsert Organization singleton (findFirst → nếu chưa có thì create với name=SEED_ORG_NAME, billingPeriodStart=now); upsert admin user (`prisma.user.upsert` theo email, passwordHash = `bcrypt.hashSync(SEED_ADMIN_PASSWORD, 10)`, role ADMIN). `package.json`: `"prisma": { "seed": "ts-node prisma/seed.ts" }` (cài `ts-node` đã có ở devDeps).
- [ ] `npx prisma db seed` → tạo org + admin. Verify bằng `prisma studio` hoặc query.
- [ ] `npm run build` PASS. Commit: `feat(db): prisma schema 14 bảng + pgvector raw SQL + seed`.

### Task 4: Auth — JWT login + me

**Files:**
- Create: `server/src/auth/auth.module.ts`, `auth.service.ts`, `auth.controller.ts`, `jwt.strategy.ts`, `dto/login.dto.ts`, `decorators/public.decorator.ts`, `decorators/current-user.decorator.ts`, `guards/jwt-auth.guard.ts`
- Test: `server/src/auth/auth.service.spec.ts`

**Interfaces:**
- Consumes: `PrismaService`.
- Produces: `POST /auth/login` → `{ accessToken }`; `GET /auth/me` → user (không passwordHash); `@Public()`, `@CurrentUser()`, `JwtAuthGuard`. JWT payload `{ sub: userId, email, role }`.

- [ ] `public.decorator.ts`: `export const IS_PUBLIC_KEY='isPublic'; export const Public=()=>SetMetadata(IS_PUBLIC_KEY,true);`
- [ ] `current-user.decorator.ts`: param decorator trả `req.user`.
- [ ] `login.dto.ts`: `@IsEmail() email; @IsString() @MinLength(6) password;`
- [ ] **Test trước:** `auth.service.spec.ts`: mock PrismaService — `validateUser` trả null khi sai mật khẩu, trả user khi đúng (bcrypt compare); `login` trả object có `accessToken`. Chạy → FAIL.
- [ ] `auth.service.ts`: `validateUser(email,pw)` (findUnique + bcrypt.compare, loại DISABLED); `login(user)` ký JWT `{sub:user.id,email,role}`.
- [ ] `jwt.strategy.ts`: PassportStrategy(Strategy) đọc Bearer, secret từ ConfigService, `validate(payload)` trả `{ userId: payload.sub, email, role }`.
- [ ] `jwt-auth.guard.ts`: extends AuthGuard('jwt'), override `canActivate` để bỏ qua khi metadata `IS_PUBLIC_KEY`.
- [ ] `auth.controller.ts`: `@Public() @Post('login')` gọi validateUser→login; `@Get('me')` trả CurrentUser (đã loại passwordHash).
- [ ] `auth.module.ts`: import JwtModule.registerAsync (secret+expiresIn từ config), providers AuthService+JwtStrategy.
- [ ] Chạy test → PASS. `npm run build` PASS. Commit: `feat(auth): JWT login + me + JwtAuthGuard`.

### Task 5: RBAC — @Roles + RolesGuard + global guards

**Files:**
- Create: `server/src/auth/decorators/roles.decorator.ts`, `server/src/auth/guards/roles.guard.ts`
- Modify: `server/src/app.module.ts` (APP_GUARD providers), `health.controller.ts` (thêm `@Public()`)
- Test: `server/src/auth/guards/roles.guard.spec.ts`

**Interfaces:**
- Consumes: `Role` enum (từ @prisma/client), `user.role`.
- Produces: `@Roles(...roles)`, `RolesGuard`. Global order: JwtAuthGuard rồi RolesGuard.

- [ ] `roles.decorator.ts`: `ROLES_KEY='roles'; Roles=(...roles:Role[])=>SetMetadata(ROLES_KEY,roles);`
- [ ] **Test trước:** `roles.guard.spec.ts` — không @Roles → true; user MANAGER với required [ADMIN,MANAGER] → true; WRITER → false. Chạy → FAIL.
- [ ] `roles.guard.ts`: theo §19 (`getAllAndOverride`, không required → true, else `required.includes(user.role)`).
- [ ] `app.module.ts`: providers `{ provide: APP_GUARD, useClass: JwtAuthGuard }` rồi `{ provide: APP_GUARD, useClass: RolesGuard }` (JWT trước). Import AuthModule, PrismaModule.
- [ ] `health.controller.ts`: thêm `@Public()`.
- [ ] Test → PASS. `npm run build` PASS. Commit: `feat(rbac): Roles decorator + RolesGuard global`.

### Task 6: Users module (ADMIN CRUD)

**Files:**
- Create: `server/src/users/users.module.ts`, `users.service.ts`, `users.controller.ts`, `dto/create-user.dto.ts`, `dto/update-user.dto.ts`

**Interfaces:**
- Consumes: PrismaService, `@Roles`, `bcrypt`.
- Produces: `POST /users`, `GET /users`, `PATCH /users/:id`, `DELETE /users/:id` (soft: status DISABLED). Tất cả `@Roles(ADMIN)`. Response loại passwordHash.

- [ ] `create-user.dto.ts`: email, fullName, password, role (IsEnum Role), status optional.
- [ ] `users.service.ts`: create (hash pw), findAll, update, disable (status=DISABLED). Helper `sanitize` bỏ passwordHash.
- [ ] `users.controller.ts`: `@Roles(Role.ADMIN)` ở class; 4 endpoint.
- [ ] `npm run build` PASS. Commit: `feat(users): admin CRUD người dùng`.

### Task 7: Organization module (ADMIN settings)

**Files:**
- Create: `server/src/organization/organization.module.ts`, `organization.service.ts`, `organization.controller.ts`, `dto/update-organization.dto.ts`

**Interfaces:**
- Produces: `GET /organization` (findFirst singleton), `PATCH /organization` (`@Roles(ADMIN)`). Update fields: name, monthlyAiBudgetUsd, defaultModel.

- [ ] `update-organization.dto.ts`: name?, monthlyAiBudgetUsd? (IsNumber), defaultModel?.
- [ ] `organization.service.ts`: `get()` = findFirstOrThrow; `update(dto)` = updateMany trên singleton rồi trả get().
- [ ] `organization.controller.ts`: GET (any authenticated), PATCH `@Roles(Role.ADMIN)`.
- [ ] `npm run build` PASS. Commit: `feat(org): xem/sửa cấu hình tổ chức + ngân sách AI`.

### Task 8: ProductLine module (CRUD)

**Files:**
- Create: `server/src/product-line/product-line.module.ts`, `product-line.service.ts`, `product-line.controller.ts`, `dto/create-product-line.dto.ts`, `dto/update-product-line.dto.ts`

**Interfaces:**
- Produces: `POST /product-lines` (ADMIN,MANAGER), `GET /product-lines` + `GET /:id` (any auth), `PATCH /:id` (ADMIN,MANAGER), `DELETE /:id` (soft delete `deletedAt`, ADMIN,MANAGER).

- [ ] `create-product-line.dto.ts`: name, slug, voiceProfile? (IsOptional object).
- [ ] `product-line.service.ts`: create, findAll (where deletedAt null), findOne, update, softRemove (set deletedAt=now).
- [ ] `product-line.controller.ts`: `@Roles` đúng ma trận từng method.
- [ ] `npm run build` PASS. Commit: `feat(product-line): CRUD dòng sản phẩm + soft delete`.

### Task 9: e2e happy path + verify tổng

**Files:**
- Modify: `server/test/app.e2e-spec.ts`

- [ ] e2e: `/health` GET → 200 không token; login admin seed → 200 + accessToken; gọi `POST /product-lines` với token role WRITER (tạo user WRITER trong seed hoặc mock) → 403; với admin → 201. (Nếu e2e cần DB, đánh dấu chạy khi có compose; tối thiểu test /health.)
- [ ] `npm run build` PASS (cổng chính). Nếu có DB: `docker compose up -d` → migrate → seed → `npm run start` → verify curl login + guard 403.
- [ ] Commit: `test(e2e): happy path health/login/rbac`.

---

## Self-Review

- **Spec coverage:** Setup(compose+env)=T2; ConfigModule=T1; 14-table schema+raw SQL+seed=T3; Auth JWT=T4; RBAC guard=T5; Users=T6; Organization=T7; ProductLine=T8; testing=T4/T5/T9; verification=T9. Đủ.
- **Placeholder scan:** không có TBD/TODO; code cho phần non-obvious đã cụ thể.
- **Type consistency:** JWT payload `{sub,email,role}` nhất quán T4↔T5; `Role` từ @prisma/client dùng chung; `@Public()`/`@Roles()` tên nhất quán.
- **Lưu ý naming:** raw SQL T3 phải khớp tên cột Prisma thực tế (verify `\d` trước khi viết index) — đã ghi rõ.
