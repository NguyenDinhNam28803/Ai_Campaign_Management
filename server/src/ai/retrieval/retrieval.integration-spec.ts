import { PrismaService } from '../../prisma/prisma.service';
import type { LLMProvider } from '../llm/llm-provider.interface';
import { RetrievalService } from './retrieval.service';

/**
 * Integration test: chứng minh retrieval đúng scope (dòng SP + company-wide)
 * trên pgvector THẬT — dùng embedder GIẢ (vector tất định), KHÔNG cần OpenAI.
 *
 * Yêu cầu DATABASE_URL (Supabase). Bỏ qua nếu không có.
 */
const VOCAB = ['coffee', 'brand', 'tea'];
function fakeEmbed(text: string): number[] {
  const v = new Array(1536).fill(0);
  const lower = text.toLowerCase();
  VOCAB.forEach((w, i) => {
    if (lower.includes(w)) v[i] = 1;
  });
  if (v.every((x) => x === 0)) v[1535] = 1; // tránh vector 0 (cosine undefined)
  return v;
}

const fakeLlm = {
  embed: async (t: string) => fakeEmbed(t),
} as unknown as LLMProvider;

const describeOrSkip = process.env.DATABASE_URL ? describe : describe.skip;

describeOrSkip('RetrievalService (integration, pgvector)', () => {
  const prisma = new PrismaService();
  const retrieval = new RetrievalService(prisma, fakeLlm);
  const stamp = Date.now();

  let plA: string;
  let plB: string;
  const sourceIds: string[] = [];

  async function seedChunk(
    productLineId: string | null,
    content: string,
    name: string,
  ) {
    const src = await prisma.knowledgeSource.create({
      data: { name, sourceType: 'PRODUCT_DOC', productLineId, status: 'READY' },
    });
    sourceIds.push(src.id);
    const literal = `[${fakeEmbed(content).join(',')}]`;
    await prisma.$executeRaw`
      INSERT INTO "KnowledgeChunk"
        (id, "productLineId", "sourceId", "chunkIndex", content, embedding, "tokenCount", "createdAt")
      VALUES
        (gen_random_uuid()::text, ${productLineId}, ${src.id}, 0, ${content}, ${literal}::vector, 3, now())
    `;
  }

  beforeAll(async () => {
    await prisma.$connect();
    const a = await prisma.productLine.create({
      data: { name: 'RAG A', slug: `rag-a-${stamp}` },
    });
    const b = await prisma.productLine.create({
      data: { name: 'RAG B', slug: `rag-b-${stamp}` },
    });
    plA = a.id;
    plB = b.id;
    await seedChunk(plA, 'coffee arabica rang xay dam', 'src-A');
    await seedChunk(null, 'brand voice guidelines chung', 'src-null');
    await seedChunk(plB, 'tea green sencha nhat ban', 'src-B');
  }, 30000);

  afterAll(async () => {
    await prisma.knowledgeChunk.deleteMany({
      where: { sourceId: { in: sourceIds } },
    });
    await prisma.knowledgeSource.deleteMany({
      where: { id: { in: sourceIds } },
    });
    await prisma.productLine.deleteMany({ where: { id: { in: [plA, plB] } } });
    await prisma.$disconnect();
  }, 30000);

  it('gộp dòng SP + company-wide (NULL), loại dòng SP khác', async () => {
    const res = await retrieval.retrieve(plA, 'coffee', 10);
    const contents = res.map((r) => r.content);
    expect(contents).toContain('coffee arabica rang xay dam'); // dòng A
    expect(contents).toContain('brand voice guidelines chung'); // company-wide
    expect(contents.some((c) => c.includes('tea'))).toBe(false); // KHÔNG lấy dòng B
  }, 30000);

  it('chunk khớp từ khóa đứng đầu kết quả', async () => {
    const res = await retrieval.retrieve(plA, 'coffee', 10);
    expect(res[0].content).toContain('coffee');
  }, 30000);
});
