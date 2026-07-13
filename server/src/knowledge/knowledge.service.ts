import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { IngestStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';

export const INGESTION_QUEUE = 'ingestion';

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(INGESTION_QUEUE) private readonly queue: Queue,
  ) {}

  /** Tạo nguồn (PENDING) + enqueue ingest. Content đi qua job (bảng không có cột body). */
  async create(dto: CreateKnowledgeDto) {
    // optional
    if (dto.productLineId) {
      const pl = await this.prisma.productLine.findFirst({
        where: { id: dto.productLineId, deletedAt: null },
      });
      if (!pl) throw new NotFoundException('Không tìm thấy dòng sản phẩm');
    }

    const source = await this.prisma.knowledgeSource.create({
      data: {
        name: dto.name,
        sourceType: dto.sourceType,
        productLineId: dto.productLineId ?? null,
        status: IngestStatus.PENDING,
      },
    });

    await this.queue.add(
      'ingest',
      { sourceId: source.id, content: dto.content },
      {
        jobId: source.id,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    return { sourceId: source.id, status: source.status };
  }

  findAll(productLineId?: string) {
    return this.prisma.knowledgeSource.findMany({
      where: { productLineId: productLineId ?? undefined },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const source = await this.prisma.knowledgeSource.findUnique({
      where: { id },
      include: { _count: { select: { chunks: true } } },
    });
    if (!source) throw new NotFoundException('Không tìm thấy nguồn tri thức');
    return source;
  }

  listChunks(id: string) {
    return this.prisma.knowledgeChunk.findMany({
      where: { sourceId: id },
      select: { id: true, chunkIndex: true, content: true, tokenCount: true },
      orderBy: { chunkIndex: 'asc' },
    });
  }
}
