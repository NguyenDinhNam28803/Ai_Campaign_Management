# P3 — RAG + Kho tri thức (pgvector) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development hoặc superpowers:executing-plans. Steps dùng checkbox `- [ ]`.

**Goal:** Nạp tài liệu tri thức (dán text), chunk + embed vào `knowledge_chunk`, và cho Generator truy hồi ngữ cảnh theo scope **`product_line_id = $1 OR IS NULL`** (dòng SP + company-wide), thay context rỗng ở P2.

**Architecture:** Thêm `KnowledgeModule` (ingest async qua BullMQ queue `ingestion`) + `RetrievalService` (embed query → vector search pgvector). `GenerationProcessor` gọi retrieval trước pipeline và lưu `retrievedChunkIds`. Không đổi schema (bảng `KnowledgeSource`/`KnowledgeChunk` + enum `IngestStatus` đã migrate ở P0).

**Tech:** NestJS 11, @nestjs/bullmq, Prisma `$queryRaw`/`$executeRaw` (vì Prisma không hỗ trợ toán tử vector `<=>` và kiểu `vector`), `LLMProvider.embed` (OpenAI `text-embedding-3-small`, 1536 chiều).

## Global Constraints
- **Không migration mới** — tái dùng bảng đã có.
- Ghi/đọc cột `embedding vector(1536)` **chỉ qua raw SQL** (Prisma bỏ qua kiểu Unsupported). Tham số vẫn để Prisma escape — không nối chuỗi thủ công (trừ vector literal `[..]` đã kiểm soát định dạng số).
- Retrieval scope **bắt buộc**: `("productLineId" = $1 OR "productLineId" IS NULL)`.
- Ingest: **log cost embedding + cộng `aiSpendPeriodUsd`, KHÔNG pre-check budget** (khác Generator).
- Input P3 chỉ **text thô** (parse PDF/DOCX/URL để pha sau).
- Tên bảng/cột theo Prisma: `"KnowledgeChunk"`, `"productLineId"`, `"sourceId"`, `"chunkIndex"`, `"tokenCount"` (PascalCase/camelCase, có ngoặc kép).

## File structure
- `src/queue/queue.module.ts` — chuyển `BullModule.forRootAsync` ra đây, export để AiModule + KnowledgeModule dùng chung `registerQueue`.
- `src/knowledge/knowledge.module.ts`, `knowledge.service.ts`, `knowledge.controller.ts`
- `src/knowledge/dto/create-knowledge.dto.ts`
- `src/knowledge/chunker.ts` (+ `chunker.spec.ts`)
- `src/knowledge/ingestion.processor.ts`
- `src/ai/retrieval/retrieval.service.ts` (+ `retrieval.integration-spec.ts` với embedder GIẢ)
- Sửa: `src/ai/ai.module.ts` (bỏ forRoot, thêm RetrievalService, import QueueModule), `src/ai/generation/generation.processor.ts` (nối retrieval), `src/app.module.ts` (import QueueModule + KnowledgeModule).

## Interfaces chính (khớp giữa các task)
- `splitText(text: string): { content: string; tokenCount: number }[]`
- `RetrievalService.retrieve(productLineId: string | null, queryText: string, k?: number): Promise<{ id: string; content: string }[]>`
- Queue `ingestion`, job `'ingest'` payload `{ sourceId: string }` (content đọc từ DB, không nhét vào job).

---

### Task 0: QueueModule dùng chung (gỡ forRoot khỏi AiModule)

**Files:** Create `src/queue/queue.module.ts`; Modify `src/ai/ai.module.ts`.

**Lý do:** `BullModule.forRoot` chỉ nên gọi 1 lần; KnowledgeModule cũng cần `registerQueue` nên phải có root dùng chung.

- [ ] Tạo `queue.module.ts`: `BullModule.forRootAsync` (đọc `redisConfig`, tách host/port từ URL — copy y hệt đang có trong ai.module) và `@Global()` + `exports: [BullModule]`.
- [ ] `ai.module.ts`: xóa block `BullModule.forRootAsync(...)`, thay bằng `imports: [QueueModule, BullModule.registerQueue({ name: GENERATION_QUEUE })]`.
- [ ] `app.module.ts`: thêm `QueueModule` vào imports (trước AiModule).
- [ ] Chạy `npm run build` → PASS (không lỗi DI Bull). Commit: `refactor(queue): tách BullModule.forRoot ra QueueModule dùng chung`.

### Task 1: Chunker + unit test

**Files:** Create `src/knowledge/chunker.ts`, `src/knowledge/chunker.spec.ts`.

**Interfaces — Produces:** `splitText(text): { content, tokenCount }[]`.

- [ ] **Test trước** (`chunker.spec.ts`):
```typescript
import { splitText } from './chunker';
describe('splitText', () => {
  it('gộp đoạn ngắn thành ít nhất 1 chunk', () => {
    const out = splitText('Xin chào. Đây là đoạn ngắn.');
    expect(out.length).toBeGreaterThanOrEqual(1);
    expect(out[0].content).toContain('Xin chào');
    expect(out[0].tokenCount).toBeGreaterThan(0);
  });
  it('văn bản dài bị cắt thành nhiều chunk (mỗi chunk ≤ ~1600 ký tự)', () => {
    const long = Array.from({ length: 50 }, (_, i) => `Đoạn số ${i} ${'x'.repeat(60)}.`).join('\n\n');
    const out = splitText(long);
    expect(out.length).toBeGreaterThan(1);
    for (const c of out) expect(c.content.length).toBeLessThanOrEqual(1600);
  });
  it('bỏ khoảng trắng thừa, không tạo chunk rỗng', () => {
    const out = splitText('\n\n   \n\nNội dung.\n\n\n');
    expect(out.every((c) => c.content.trim().length > 0)).toBe(true);
  });
});
```
- [ ] Chạy → FAIL (`splitText` chưa có).
- [ ] Viết `chunker.ts`:
```typescript
const MAX_CHARS = 1500;

/** Chia text theo đoạn, gộp tới ~1500 ký tự/chunk. tokenCount ≈ len/4. */
export function splitText(text: string): { content: string; tokenCount: number }[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buf = '';
  for (const p of paragraphs) {
    if (buf && buf.length + p.length + 1 > MAX_CHARS) {
      chunks.push(buf);
      buf = '';
    }
    if (p.length > MAX_CHARS) {
      // đoạn quá dài: cắt cứng
      if (buf) { chunks.push(buf); buf = ''; }
      for (let i = 0; i < p.length; i += MAX_CHARS) chunks.push(p.slice(i, i + MAX_CHARS));
    } else {
      buf = buf ? `${buf} ${p}` : p;
    }
  }
  if (buf) chunks.push(buf);

  return chunks.map((content) => ({ content, tokenCount: Math.ceil(content.length / 4) }));
}
```
- [ ] Chạy → PASS. `npm run build`. Commit: `feat(knowledge): chunker text + unit`.

### Task 2: KnowledgeService + Controller + DTO (tạo source + list + detail)

**Files:** Create `src/knowledge/knowledge.service.ts`, `knowledge.controller.ts`, `dto/create-knowledge.dto.ts`, `knowledge.module.ts`.

**Interfaces — Consumes:** PrismaService, Queue `ingestion`. **Produces:** endpoints dưới.

- [ ] `create-knowledge.dto.ts`: `name` (string), `sourceType` (IsEnum SourceType), `productLineId?` (IsUUID, optional = company-wide), `content` (string, MinLength 1).
- [ ] `knowledge.service.ts`:
  - `create(dto, userId)`: tạo `KnowledgeSource` (status PENDING, productLineId nullable); enqueue `ingestion.add('ingest', { sourceId }, { jobId: source.id, attempts: 3, backoff })`; lưu tạm content ở đâu? → **thêm cột không có** ⇒ truyền content qua job payload thay vì DB (KnowledgeSource không có cột body). Sửa: enqueue `{ sourceId, content }`. Trả `{ sourceId, status }`.
  - `findAll(productLineId?)`: list sources (mới nhất trước).
  - `findOne(id)`: source + đếm chunks.
  - `listChunks(id)`: `prisma.knowledgeChunk.findMany({ where: { sourceId: id }, select: { id, chunkIndex, content, tokenCount }, orderBy: { chunkIndex: 'asc' } })`.
- [ ] `knowledge.controller.ts` (`@Controller('knowledge')`):
  - `POST /` (ADMIN, MANAGER, EDITOR) → create.
  - `GET /?productLineId=` (auth) → findAll.
  - `GET /:id` (auth) → findOne.
  - `GET /:id/chunks` (auth) → listChunks.
- [ ] `knowledge.module.ts`: `imports: [QueueModule, BullModule.registerQueue({ name: 'ingestion' })]`, providers `[KnowledgeService, IngestionProcessor]` (processor thêm ở Task 3), controller.
- [ ] `app.module.ts`: thêm `KnowledgeModule`.
- [ ] `npm run build`. Commit: `feat(knowledge): source CRUD + enqueue ingest`.

### Task 3: IngestionProcessor (chunk → embed → lưu raw SQL + cost)

**Files:** Create `src/knowledge/ingestion.processor.ts`.

**Interfaces — Consumes:** PrismaService, `LLM_PROVIDER`, `splitText`. Payload job: `{ sourceId, content }`.

- [ ] Viết processor:
```typescript
@Processor('ingestion')
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);
  constructor(
    private prisma: PrismaService,
    @Inject(LLM_PROVIDER) private llm: LLMProvider,
  ) { super(); }

  async process(job: Job<{ sourceId: string; content: string }>) {
    const { sourceId, content } = job.data;
    const source = await this.prisma.knowledgeSource.findUniqueOrThrow({ where: { id: sourceId } });
    await this.prisma.knowledgeSource.update({ where: { id: sourceId }, data: { status: 'PROCESSING' } });
    try {
      const chunks = splitText(content);
      let totalTokens = 0;
      for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        const embedding = await this.llm.embed(c.content);      // [1536]
        const literal = `[${embedding.join(',')}]`;
        await this.prisma.$executeRaw`
          INSERT INTO "KnowledgeChunk" (id, "productLineId", "sourceId", "chunkIndex", content, embedding, "tokenCount", "createdAt")
          VALUES (gen_random_uuid(), ${source.productLineId}::uuid, ${sourceId}::uuid, ${i}, ${c.content}, ${literal}::vector, ${c.tokenCount}, now())
        `;
        totalTokens += c.tokenCount;
      }
      // Log cost embedding, KHÔNG pre-check budget.
      const cost = estimateCost('text-embedding-3-small', totalTokens, 0);
      await this.prisma.organization.updateMany({ data: { aiSpendPeriodUsd: { increment: cost } } });
      this.logger.log(`Ingest ${sourceId}: ${chunks.length} chunks, ~${totalTokens} tokens, $${cost}`);
      await this.prisma.knowledgeSource.update({ where: { id: sourceId }, data: { status: 'READY' } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Ingest ${sourceId} lỗi: ${msg}`);
      await this.prisma.knowledgeSource.update({ where: { id: sourceId }, data: { status: 'FAILED' } });
      throw e;
    }
  }
}
```
- [ ] Chú ý `${source.productLineId}::uuid` khi null → dùng `Prisma.sql` xử lý null, hoặc tách 2 nhánh (có/không productLineId). An toàn: nếu `source.productLineId` null thì cột nhận NULL — `${null}::uuid` cho ra `NULL::uuid` hợp lệ. Kiểm tra khi test.
- [ ] Đăng ký `IngestionProcessor` trong `knowledge.module.ts` providers.
- [ ] `npm run build`. Commit: `feat(knowledge): ingestion worker (chunk+embed+cost)`.

### Task 4: RetrievalService + **integration test scope (không cần OpenAI)**

**Files:** Create `src/ai/retrieval/retrieval.service.ts`, `src/ai/retrieval/retrieval.integration-spec.ts`.

**Interfaces — Produces:** `retrieve(productLineId, queryText, k=6)`.

- [ ] `retrieval.service.ts`:
```typescript
@Injectable()
export class RetrievalService {
  constructor(
    private prisma: PrismaService,
    @Inject(LLM_PROVIDER) private llm: LLMProvider,
  ) {}

  async retrieve(productLineId: string | null, queryText: string, k = 6) {
    const embedding = await this.llm.embed(queryText);
    const literal = `[${embedding.join(',')}]`;
    return this.prisma.$queryRaw<Array<{ id: string; content: string }>>`
      SELECT id, content
      FROM "KnowledgeChunk"
      WHERE ("productLineId" = ${productLineId}::uuid OR "productLineId" IS NULL)
      ORDER BY embedding <=> ${literal}::vector
      LIMIT ${k}
    `;
  }
}
```
- [ ] **Integration test với embedder GIẢ** (chạy trên Supabase thật, KHÔNG gọi OpenAI). Ý tưởng: map "từ khóa" → vector one-hot tất định để cosine so khớp; kiểm scope.
```typescript
// retrieval.integration-spec.ts (rút gọn — xem chi tiết khi implement)
// FakeEmbedder: embed(text) => vector 1536 chiều, bật chiều theo hash từ khóa chính.
// Seed: PL-A + chunk "coffee"(A), chunk "brand"(NULL), chunk "tea"(PL-B) — insert bằng cùng raw SQL như processor.
// Test 1: retrieve(A.id, "coffee") trả về tập chứa chunk(A) và chunk(NULL), KHÔNG chứa chunk(B).
// Test 2: chunk khớp từ khóa ("coffee") đứng đầu kết quả.
// Cleanup: xóa source/chunk/PL đã tạo.
```
  - Test này dùng `RetrievalService` với `LLM_PROVIDER` = FakeEmbedder (deterministic). Chứng minh **scope `OR IS NULL` + vector search** đúng trên pgvector — độc lập OpenAI.
- [ ] Chạy integration test → PASS (cần Supabase; đánh dấu skip nếu không có `DATABASE_URL`).
- [ ] `npm run build`. Commit: `feat(rag): RetrievalService + test scope company-wide/productLine`.

### Task 5: Nối retrieval vào Generator

**Files:** Modify `src/ai/generation/generation.processor.ts`, `src/ai/ai.module.ts`.

- [ ] `ai.module.ts`: thêm `RetrievalService` vào providers (và export nếu cần).
- [ ] `generation.processor.ts`: inject `RetrievalService`; thay `pipeline.run(brief, [])` bằng:
```typescript
const chunks = await this.retrieval.retrieve(gen.productLineId, brief);
const out = await this.pipeline.run(brief, chunks);
...
// trong transaction, thêm khi update AIGeneration DONE:
retrievedChunkIds: chunks.map((c) => c.id),
```
- [ ] `npm run build`. Commit: `feat(rag): Generator dùng ngữ cảnh RAG + lưu retrievedChunkIds`.

## Verification
- `npm run build` sạch; **unit chunker pass**; **integration retrieval pass** (scope đúng) trên Supabase — *không cần OpenAI credit*.
- Smoke đầy đủ (ingest thật + generate có RAG): **hoãn tới khi có credit OpenAI** — khi có, chạy: tạo source → chờ READY → generate → kiểm `retrievedChunkIds` không rỗng + bài bám ngữ cảnh.

## Self-Review
- **Spec coverage:** ingest (T2/T3), chunk (T1), embed+store (T3), retrieval scope OR NULL (T4), nối Generator + retrievedChunkIds (T5), cost log no-gate (T3), queue dùng chung (T0). Đủ theo §11/§23 tài liệu.
- **Placeholder:** integration test chỉ mô tả khung (FakeEmbedder) — sẽ viết code đầy đủ khi implement; đánh dấu rõ.
- **Type nhất quán:** `retrieve(productLineId: string|null,...)`; payload job `{ sourceId, content }` nhất quán T2↔T3.
- **Rủi ro:** `${null}::uuid` trong raw SQL — kiểm ở T3/T4; nếu lỗi, tách nhánh câu lệnh cho productLineId null.
