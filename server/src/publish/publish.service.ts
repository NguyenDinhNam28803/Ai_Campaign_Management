import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { assertCanEditPiece } from '../content/ownership';
import { canTransition } from '../content/content-workflow';
import { CreatePublicationDto } from './dto/create-publication.dto';

@Injectable()
export class PublishService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePublicationDto, user: AuthUser) {
    const piece = await this.prisma.contentPiece.findFirst({
      where: { id: dto.pieceId, deletedAt: null },
    });
    if (!piece) throw new NotFoundException('Content piece không tồn tại');
    assertCanEditPiece(user, piece);

    if (
      piece.status !== ContentStatus.APPROVED &&
      piece.status !== ContentStatus.SCHEDULED
    ) {
      throw new BadRequestException(
        'Chỉ có thể đăng nội dung đã duyệt hoặc đã lên lịch',
      );
    }

    const channel = await this.prisma.channel.findFirst({
      where: { id: dto.channelId, status: 'ACTIVE' },
    });
    if (!channel) throw new NotFoundException('Channel không tồn tại hoặc đã ngắt');
    if (channel.productLineId !== piece.productLineId) {
      throw new BadRequestException(
        'Channel phải thuộc cùng ProductLine với nội dung',
      );
    }

    const version = await this.prisma.contentVersion.findFirst({
      where: { pieceId: dto.pieceId },
      orderBy: { versionNumber: 'desc' },
    });
    if (!version) {
      throw new BadRequestException('Nội dung chưa có phiên bản nào');
    }

    const pubStatus = dto.scheduledAt
      ? PublishStatus.PENDING
      : PublishStatus.PENDING;

    const pub = await this.prisma.$transaction(async (tx) => {
      const p = await tx.publication.create({
        data: {
          productLineId: piece.productLineId,
          pieceId: dto.pieceId,
          versionId: version.id,
          channelId: dto.channelId,
          status: pubStatus,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        },
      });

      await tx.outboxEvent.create({
        data: {
          aggregateType: 'Publication',
          aggregateId: p.id,
          eventType: dto.scheduledAt
            ? 'PUBLICATION_SCHEDULED'
            : 'PUBLICATION_CREATED',
          payload: { publicationId: p.id },
        },
      });

      // Transition piece: APPROVED → SCHEDULED
      if (
        piece.status === ContentStatus.APPROVED &&
        canTransition(ContentStatus.APPROVED, ContentStatus.SCHEDULED)
      ) {
        await tx.contentPiece.update({
          where: { id: dto.pieceId },
          data: { status: ContentStatus.SCHEDULED },
        });
      }

      return p;
    });

    return pub;
  }

  async findAll(filters: {
    pieceId?: string;
    channelId?: string;
    status?: string;
  }) {
    return this.prisma.publication.findMany({
      where: {
        ...(filters.pieceId && { pieceId: filters.pieceId }),
        ...(filters.channelId && { channelId: filters.channelId }),
        ...(filters.status && {
          status: filters.status as PublishStatus,
        }),
      },
      include: { channel: { select: { name: true, type: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pub = await this.prisma.publication.findUnique({
      where: { id },
      include: {
        channel: { select: { name: true, type: true } },
        piece: { select: { title: true, contentType: true } },
      },
    });
    if (!pub) throw new NotFoundException('Publication không tồn tại');
    return pub;
  }

  async publishNow(id: string) {
    const pub = await this.prisma.publication.findUnique({ where: { id } });
    if (!pub) throw new NotFoundException('Publication không tồn tại');
    if (pub.status !== PublishStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể đăng publication đang chờ');
    }

    await this.prisma.outboxEvent.create({
      data: {
        aggregateType: 'Publication',
        aggregateId: pub.id,
        eventType: 'PUBLICATION_PUBLISH',
        payload: { publicationId: pub.id },
      },
    });

    return { ok: true };
  }

  async schedule(id: string, scheduledAt: string) {
    const pub = await this.prisma.publication.findUnique({ where: { id } });
    if (!pub) throw new NotFoundException('Publication không tồn tại');

    return this.prisma.publication.update({
      where: { id },
      data: {
        scheduledAt: new Date(scheduledAt),
        status: PublishStatus.PENDING,
      },
    });
  }
}
