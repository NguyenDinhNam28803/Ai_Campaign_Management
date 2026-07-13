import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { IngestStatus, Prisma } from '@prisma/client';
import { Job } from 'bullmq';
import { estimateCost } from '../ai/llm/cost';
import { LLM_PROVIDER } from '../ai/llm/llm-provider.interface';
import type { LLMProvider } from '../ai/llm/llm-provider.interface';
import { PrismaService } from '../prisma/prisma.service';
import { splitText } from './chunker';
import { INGESTION_QUEUE } from './knowledge.service';

interface IngestJob {
  sourceId: string;
  content: string;
}

@Processor(INGESTION_QUEUE)
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_PROVIDER) private readonly llm: LLMProvider,
  ) {
    super();
  }

  async process(job: Job<IngestJob>): Promise<void> {
    const { sourceId, content } = job.data;
    const source = await this.prisma.knowledgeSource.findUniqueOrThrow({
      where: { id: sourceId },
    });
    await this.prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: { status: IngestStatus.PROCESSING },
    });

    try {
      const chunks = splitText(content);
      let totalTokens = 0;

      for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        const embedding = await this.llm.embed(c.content); // [1536]
        const literal = `[${embedding.join(',')}]`;
        // productLineId có thể null (company-wide). Prisma.sql xử lý null an toàn.
        await this.prisma.$executeRaw`
          INSERT INTO "KnowledgeChunk"
            (id, "productLineId", "sourceId", "chunkIndex", content, embedding, "tokenCount", "createdAt")
          VALUES
            (gen_random_uuid()::text, ${source.productLineId}, ${sourceId}, ${i}, ${c.content}, ${literal}::vector, ${c.tokenCount}, now())
        `;
        totalTokens += c.tokenCount;
      }

      // Log cost embedding + cộng org spend — KHÔNG pre-check budget (ingest là hạ tầng).
      const cost = estimateCost('text-embedding-3-small', totalTokens, 0);
      await this.prisma.organization.updateMany({
        data: { aiSpendPeriodUsd: { increment: new Prisma.Decimal(cost) } },
      });
      this.logger.log(
        `Ingest ${sourceId}: ${chunks.length} chunks, ~${totalTokens} tokens, $${cost}`,
      );

      await this.prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: { status: IngestStatus.READY },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Ingest ${sourceId} lỗi: ${msg}`);
      await this.prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: { status: IngestStatus.FAILED },
      });
      throw e; // BullMQ retry
    }
  }
}
