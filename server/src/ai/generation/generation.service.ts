import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiMode, AiStep, JobStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { AuthUser } from '../../auth/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { assertCanEditPiece } from '../../content/ownership';
import { BudgetService } from '../budget/budget.service';

export const GENERATION_QUEUE = 'generation';

@Injectable()
export class GenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly budget: BudgetService,
    private readonly config: ConfigService,
    @InjectQueue(GENERATION_QUEUE) private readonly queue: Queue,
  ) {}

  /** Nhận yêu cầu sinh bài: pre-check ngân sách → tạo AIGeneration → enqueue idempotent. */
  async requestGeneration(pieceId: string, user: AuthUser) {
    // 1) BUDGET PRE-CHECK trước khi nhận việc.
    await this.budget.assertWithinBudget();

    const piece = await this.prisma.contentPiece.findFirst({
      where: { id: pieceId, deletedAt: null },
    });
    if (!piece) {
      throw new NotFoundException('Không tìm thấy nội dung');
    }
    assertCanEditPiece(user, piece);

    const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';

    // 2) Bản ghi generation (QUEUED) = nguồn sự thật trạng thái job.
    const gen = await this.prisma.aIGeneration.create({
      data: {
        productLineId: piece.productLineId,
        pieceId: piece.id,
        mode: AiMode.GENERATOR,
        step: AiStep.DRAFT,
        status: JobStatus.QUEUED,
        model,
        promptVersion: 'gen-v1',
        createdBy: user.userId,
      },
    });

    // 3) Enqueue với jobId = gen.id => idempotent (bấm 2 lần không tạo 2 job).
    await this.queue.add(
      'generate',
      { generationId: gen.id },
      { jobId: gen.id, attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );

    return { generationId: gen.id, status: gen.status };
  }

  getStatus(id: string) {
    return this.prisma.aIGeneration.findUniqueOrThrow({ where: { id } });
  }
}
