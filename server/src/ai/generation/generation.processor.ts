import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { JobStatus, VersionSource } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { estimateCost } from '../llm/cost';
import { RetrievalService } from '../retrieval/retrieval.service';
import { GenerationPipeline } from './generation.pipeline';
import { GENERATION_QUEUE } from './generation.service';

interface GenerationJob {
  generationId: string;
}

@Processor(GENERATION_QUEUE)
export class GenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(GenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: GenerationPipeline,
    private readonly retrieval: RetrievalService,
  ) {
    super();
  }

  async process(job: Job<GenerationJob>): Promise<void> {
    const gen = await this.prisma.aIGeneration.findUniqueOrThrow({
      where: { id: job.data.generationId },
    });
    await this.prisma.aIGeneration.update({
      where: { id: gen.id },
      data: { status: JobStatus.RUNNING },
    });

    try {
      const piece = await this.prisma.contentPiece.findUniqueOrThrow({
        where: { id: gen.pieceId! },
        include: { currentVersion: true },
      });
      const brief = `${piece.title}\n\n${piece.currentVersion?.body ?? ''}`.trim();

      // RAG: truy hồi ngữ cảnh theo dòng SP + company-wide.
      const chunks = await this.retrieval.retrieve(gen.productLineId, brief);
      const out = await this.pipeline.run(brief, chunks);
      const cost = estimateCost(gen.model, out.inputTokens, out.outputTokens);

      const last = await this.prisma.contentVersion.findFirst({
        where: { pieceId: gen.pieceId! },
        orderBy: { versionNumber: 'desc' },
      });

      // Lưu version + log cost + cộng ngân sách TRONG CÙNG 1 TRANSACTION.
      await this.prisma.$transaction([
        this.prisma.contentVersion.create({
          data: {
            pieceId: gen.pieceId!,
            versionNumber: (last?.versionNumber ?? 0) + 1,
            body: out.text,
            source: VersionSource.AI_DRAFT,
            aiGenerationId: gen.id,
            createdBy: gen.createdBy,
          },
        }),
        this.prisma.aIGeneration.update({
          where: { id: gen.id },
          data: {
            status: JobStatus.DONE,
            inputTokens: out.inputTokens,
            outputTokens: out.outputTokens,
            costUsd: cost,
            retrievedChunkIds: chunks.map((c) => c.id),
            completedAt: new Date(),
          },
        }),
        this.prisma.organization.updateMany({
          data: { aiSpendPeriodUsd: { increment: cost } },
        }),
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(`Generation ${gen.id} thất bại: ${message}`);
      await this.prisma.aIGeneration.update({
        where: { id: gen.id },
        data: { status: JobStatus.FAILED, error: message.slice(0, 1000) },
      });
      throw e; // để BullMQ retry theo attempts/backoff
    }
  }
}
