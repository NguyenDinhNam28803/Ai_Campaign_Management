# P1 — Content Workflow Implementation Plan

**Goal:** Cho phép soạn nội dung thủ công đi trọn vòng đời: viết → submit → duyệt → approve (chưa có AI, chưa publish thật).

**Architecture:** Thêm 2 module NestJS `CampaignModule`, `ContentModule` (gồm versioning + review) trên nền P0. State machine tập trung ở `content-workflow.ts`. Versioning: mỗi lần sửa nội dung tạo `ContentVersion` mới (source `HUMAN_EDIT`) và cập nhật `currentVersionId`.

**Tech Stack:** NestJS 11, Prisma (schema đã migrate ở P0 — P1 không đổi schema).

## Global Constraints
- Không đổi schema DB (14 bảng đã có). P1 chỉ thêm code.
- State machine là chốt chặn duy nhất; AI/manual đều gọi `assertTransition`.
- RBAC theo §7. WRITER chỉ thao tác nội dung của mình (`createdBy` hoặc `assigneeId` = userId).
- Giữ cả lịch sử version — không sửa đè `ContentVersion`.

## State machine (§20)
```
DRAFT     → [IN_REVIEW]
IN_REVIEW → [DRAFT, APPROVED]
APPROVED  → [DRAFT, SCHEDULED, PUBLISHED]
SCHEDULED → [PUBLISHED]
PUBLISHED → [ARCHIVED]
ARCHIVED  → []
```
P1 dùng: DRAFT↔IN_REVIEW→APPROVED, APPROVED→DRAFT (reopen). SCHEDULED/PUBLISHED để P5.

## RBAC P1
| Hành động | ADMIN | MANAGER | EDITOR | WRITER |
|---|:-:|:-:|:-:|:-:|
| Campaign CRUD | ✅ | ✅ | ❌ | ❌ |
| Tạo/sửa nội dung bất kỳ | ✅ | ✅ | ✅ | ❌ |
| Tạo/sửa nội dung của mình | ✅ | ✅ | ✅ | ✅ |
| Submit bài của mình | ✅ | ✅ | ✅ | ✅ |
| Duyệt (Review approve/request-changes) | ✅ | ✅ | ❌ | ❌ |

## Endpoints
**Campaign**
- `POST /campaigns` (ADMIN,MANAGER) — {productLineId, name, goal?, startDate?, endDate?}
- `GET /campaigns?productLineId=` · `GET /campaigns/:id` (auth)
- `PATCH /campaigns/:id` (ADMIN,MANAGER) · `DELETE /campaigns/:id` soft (ADMIN,MANAGER)

**Content**
- `POST /content` — {campaignId, title, contentType, body, assigneeId?} → tạo piece (DRAFT) + version #1 (HUMAN_EDIT). EDITOR+ bất kỳ; WRITER tự gán mình.
- `GET /content?campaignId=&status=` · `GET /content/:id` (kèm currentVersion)
- `GET /content/:id/versions` — lịch sử
- `PATCH /content/:id` — sửa metadata (title, assigneeId). ownership.
- `POST /content/:id/versions` — {body} sửa nội dung → version mới (chỉ khi DRAFT). ownership.
- `POST /content/:id/submit` — DRAFT→IN_REVIEW. ownership (tác giả) hoặc EDITOR+.
- `POST /content/:id/reopen` — APPROVED→DRAFT (ADMIN,MANAGER,EDITOR).
- `POST /content/:id/reviews` — {decision, comment?} (ADMIN,MANAGER). APPROVED→approve piece; CHANGES_REQUESTED→DRAFT; COMMENT→không đổi status.

## Files
- `src/content/content-workflow.ts` (+ `.spec.ts`)
- `src/campaign/{campaign.module,service,controller}.ts` + `dto/{create,update}-campaign.dto.ts`
- `src/content/{content.module,service,controller}.ts` + `dto/{create-content,update-content,create-version,create-review}.dto.ts`
- `src/content/ownership.ts` helper (WRITER own-only)
- wire vào `app.module.ts`
- e2e mở rộng `test/app.e2e-spec.ts`

## Tasks (TDD)
1. `content-workflow.ts` + unit test (valid/invalid transition). Commit.
2. CampaignModule CRUD. Build. Commit.
3. ContentModule: create piece + version #1, get/list, versions history. Build. Commit.
4. Ownership + edit version (chỉ DRAFT) + PATCH metadata. Build. Commit.
5. submit/reopen + Review (áp transition qua assertTransition). Unit test review→transition. Build. Commit.
6. e2e vòng đời: create→submit→(WRITER approve =403)→(MANAGER approve=201)→status APPROVED; request-changes→DRAFT. Build. Verify Supabase. Commit.

## Verification
- `npm run build` sạch.
- `npx jest` unit pass (workflow + review).
- `npx jest --config ./test/jest-e2e.json` pass trên Supabase.
