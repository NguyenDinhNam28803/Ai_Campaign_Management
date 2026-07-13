# P2 — Generator async + kiểm soát chi phí

**Goal:** Sinh nội dung bằng AI chạy nền (BullMQ), có kiểm soát ngân sách org, log chi phí từng lần gọi, lưu ContentVersion(AI_DRAFT) — không đẩy status qua duyệt.

**Architecture:** `AiModule` thêm: `LLMProvider` (interface) + `OpenAIProvider`, `BudgetService` (pre-check org budget), `GenerationService` (enqueue idempotent), `GenerationProcessor` (BullMQ worker), `GenerationPipeline` (đa bước). `AIGeneration` là nguồn sự thật trạng thái job (QUEUED/RUNNING/DONE/FAILED).

**Tech:** NestJS 11, @nestjs/bullmq + bullmq (Redis local), openai SDK, Prisma.

## Global Constraints
- **Budget pre-check TRƯỚC khi enqueue** — vượt ngân sách chặn ngay tại cổng.
- Enqueue **idempotent**: `jobId = generation.id`.
- Lưu version + cộng cost + set DONE trong **cùng 1 transaction**.
- Token lấy từ field `usage` của response OpenAI (không tự đếm).
- RAG chưa có (P3) → pipeline chạy với context rỗng; brief = title + body hiện hành.
- AI chỉ tạo version mới, **không** đổi `ContentPiece.status`.

## Files (src/ai/)
- `llm/llm-provider.interface.ts` — `LLMProvider`, `GenerationResult`, `LLM_PROVIDER` token
- `llm/openai.provider.ts` — complete / stream / embed
- `llm/cost.ts` — `estimateCost(model, inT, outT)` + bảng giá
- `budget/budget.service.ts` — `assertWithinBudget()`
- `generation/generation.pipeline.ts` — outline → draft → SEO, cộng dồn token
- `generation/generation.service.ts` — `requestGeneration(pieceId, user)`
- `generation/generation.processor.ts` — worker: RAG(stub) → pipeline → lưu version + cost (1 txn)
- `generation/generation.controller.ts` — `POST /content/:id/generate`, `GET /generations/:id`
- `dto/` , `ai.module.ts`, wire vào `app.module.ts` (+ BullModule.forRootAsync)

## Endpoints
- `POST /content/:id/generate` → 202 `{ generationId }`. Mọi role gọi được (WRITER own-only). Budget pre-check.
- `GET /generations/:id` → trạng thái job (poll). Đã đăng nhập.

## RBAC
"Gọi AI" = cả 4 role (§7). WRITER chỉ trên bài của mình (assertCanEditPiece).

## Tasks (TDD)
1. `cost.ts` + unit (estimateCost đúng theo bảng giá). Commit.
2. `budget.service.ts` + unit (spend ≥ budget → Forbidden). Commit.
3. `llm-provider.interface.ts` + `openai.provider.ts`. Build. Commit.
4. `generation.pipeline.ts` + unit với LLM mock (3 bước, cộng token). Commit.
5. `generation.service.ts` + `generation.processor.ts` + controller + `ai.module.ts` + wire Bull. Build. Commit.
6. **Smoke test thật:** set org budget → POST generate → poll DONE → kiểm version AI_DRAFT + cost > 0 + org spend tăng. Commit.

## Verification
- `npm run build` sạch; unit pass (cost, budget, pipeline mocked — không tốn token).
- Smoke thật 1 lần với gpt-4o-mini (chi phí ~$0.001) qua Redis + OpenAI.
- Vượt ngân sách → `POST /generate` trả 403.
