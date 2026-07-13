import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LLM_PROVIDER } from '../llm/llm-provider.interface';
import type { LLMProvider } from '../llm/llm-provider.interface';

export interface RetrievedChunk {
  id: string;
  content: string;
}

@Injectable()
export class RetrievalService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_PROVIDER) private readonly llm: LLMProvider,
  ) {}

  /**
   * Vector search gộp tri thức của dòng SP + company-wide (product_line_id IS NULL).
   * Dùng $queryRaw vì Prisma chưa hỗ trợ toán tử vector `<=>`.
   */
  async retrieve(
    productLineId: string | null,
    queryText: string,
    k = 6,
  ): Promise<RetrievedChunk[]> {
    const embedding = await this.llm.embed(queryText);
    const literal = `[${embedding.join(',')}]`;
    return this.prisma.$queryRaw<RetrievedChunk[]>`
      SELECT id, content
      FROM "KnowledgeChunk"
      WHERE ("productLineId" = ${productLineId} OR "productLineId" IS NULL)
      ORDER BY embedding <=> ${literal}::vector
      LIMIT ${k}
    `;
  }
}
