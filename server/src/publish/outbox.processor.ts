import { Inject, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ChannelType, PublishStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { decrypt } from '../channel/encryption.util';
import type { ChannelAdapter } from './adapters/channel.adapter';
import {
  WORDPRESS_ADAPTER,
  STUB_ADAPTER,
} from './adapters/adapter.tokens';

export const OUTBOX_QUEUE = 'outbox';

@Processor(OUTBOX_QUEUE)
export class OutboxProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboxProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WORDPRESS_ADAPTER) private readonly wpAdapter: ChannelAdapter,
    @Inject(STUB_ADAPTER) private readonly stubAdapter: ChannelAdapter,
  ) {
    super();
  }

  async process(_job: Job): Promise<void> {
    const events = await this.prisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    for (const event of events) {
      try {
        await this.handleEvent(event);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { status: 'PROCESSED', processedAt: new Date() },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Outbox event ${event.id} failed: ${message}`);
        const newRetry = event.retryCount + 1;
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: newRetry >= 3 ? 'FAILED' : 'PENDING',
            retryCount: newRetry,
          },
        });
      }
    }
  }

  private async handleEvent(event: {
    eventType: string;
    payload: unknown;
  }): Promise<void> {
    const payload = event.payload as { publicationId: string };
    const pubId = payload.publicationId;

    if (
      event.eventType === 'PUBLICATION_CREATED' ||
      event.eventType === 'PUBLICATION_PUBLISH'
    ) {
      const pub = await this.prisma.publication.findUniqueOrThrow({
        where: { id: pubId },
        include: {
          channel: true,
          piece: { include: { currentVersion: true } },
        },
      });

      if (pub.scheduledAt && pub.scheduledAt > new Date()) {
        return;
      }

      await this.prisma.publication.update({
        where: { id: pubId },
        data: { status: PublishStatus.PUBLISHING },
      });

      const adapter = this.getAdapter(pub.channel.type);
      const credentials = decrypt(pub.channel.credentialsEncrypted);

      const result = await adapter.publish(
        pub.channel.config as Record<string, unknown>,
        credentials,
        {
          title: pub.piece.title,
          body: pub.piece.currentVersion?.body ?? '',
          contentType: pub.piece.contentType,
        },
      );

      await this.prisma.$transaction([
        this.prisma.publication.update({
          where: { id: pubId },
          data: {
            status: PublishStatus.LIVE,
            externalId: result.externalId,
            externalUrl: result.externalUrl,
            publishedAt: new Date(),
          },
        }),
        this.prisma.contentPiece.update({
          where: { id: pub.pieceId },
          data: { status: PublishStatus.LIVE as any },
        }),
      ]);
    }
  }

  private getAdapter(type: ChannelType): ChannelAdapter {
    switch (type) {
      case ChannelType.WORDPRESS:
        return this.wpAdapter;
      default:
        return this.stubAdapter;
    }
  }
}
