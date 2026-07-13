import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentPiece,
  ContentStatus,
  ReviewDecision,
  VersionSource,
} from '@prisma/client';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { assertTransition } from './content-workflow';
import { CreateContentDto } from './dto/create-content.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { assertCanEditPiece } from './ownership';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tạo bài mới ở DRAFT + version #1 (HUMAN_EDIT) trong 1 transaction. */
  async create(dto: CreateContentDto, user: AuthUser): Promise<ContentPiece> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: dto.campaignId, deletedAt: null },
    });
    if (!campaign) {
      throw new NotFoundException('Không tìm thấy chiến dịch');
    }

    return this.prisma.$transaction(async (tx) => {
      const piece = await tx.contentPiece.create({
        data: {
          productLineId: campaign.productLineId,
          campaignId: dto.campaignId,
          title: dto.title,
          contentType: dto.contentType,
          status: ContentStatus.DRAFT,
          createdBy: user.userId,
          assigneeId: dto.assigneeId ?? user.userId,
        },
      });
      const version = await tx.contentVersion.create({
        data: {
          pieceId: piece.id,
          versionNumber: 1,
          body: dto.body,
          source: VersionSource.HUMAN_EDIT,
          createdBy: user.userId,
        },
      });
      return tx.contentPiece.update({
        where: { id: piece.id },
        data: { currentVersionId: version.id },
        include: { currentVersion: true },
      });
    });
  }

  findAll(campaignId?: string, status?: ContentStatus) {
    return this.prisma.contentPiece.findMany({
      where: {
        deletedAt: null,
        campaignId: campaignId ?? undefined,
        status: status ?? undefined,
      },
      include: { currentVersion: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const piece = await this.prisma.contentPiece.findFirst({
      where: { id, deletedAt: null },
      include: { currentVersion: true },
    });
    if (!piece) {
      throw new NotFoundException('Không tìm thấy nội dung');
    }
    return piece;
  }

  listVersions(id: string) {
    return this.prisma.contentVersion.findMany({
      where: { pieceId: id },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async updateMeta(id: string, dto: UpdateContentDto, user: AuthUser) {
    const piece = await this.getOrThrow(id);
    assertCanEditPiece(user, piece);
    return this.prisma.contentPiece.update({
      where: { id },
      data: { title: dto.title, assigneeId: dto.assigneeId },
      include: { currentVersion: true },
    });
  }

  /** Sửa nội dung: chỉ khi DRAFT, tạo version mới rồi trỏ currentVersion. */
  async addVersion(id: string, dto: CreateVersionDto, user: AuthUser) {
    const piece = await this.getOrThrow(id);
    assertCanEditPiece(user, piece);
    if (piece.status !== ContentStatus.DRAFT) {
      throw new BadRequestException(
        'Chỉ sửa nội dung khi bài đang ở DRAFT',
      );
    }
    const last = await this.prisma.contentVersion.findFirst({
      where: { pieceId: id },
      orderBy: { versionNumber: 'desc' },
    });
    return this.prisma.$transaction(async (tx) => {
      const version = await tx.contentVersion.create({
        data: {
          pieceId: id,
          versionNumber: (last?.versionNumber ?? 0) + 1,
          body: dto.body,
          source: VersionSource.HUMAN_EDIT,
          createdBy: user.userId,
        },
      });
      return tx.contentPiece.update({
        where: { id },
        data: { currentVersionId: version.id },
        include: { currentVersion: true },
      });
    });
  }

  /** DRAFT -> IN_REVIEW (tác giả hoặc EDITOR+). */
  async submit(id: string, user: AuthUser) {
    const piece = await this.getOrThrow(id);
    assertCanEditPiece(user, piece);
    assertTransition(piece.status, ContentStatus.IN_REVIEW);
    return this.prisma.contentPiece.update({
      where: { id },
      data: { status: ContentStatus.IN_REVIEW },
      include: { currentVersion: true },
    });
  }

  /** APPROVED -> DRAFT (reopen). Role kiểm ở controller. */
  async reopen(id: string) {
    const piece = await this.getOrThrow(id);
    assertTransition(piece.status, ContentStatus.DRAFT);
    return this.prisma.contentPiece.update({
      where: { id },
      data: { status: ContentStatus.DRAFT },
      include: { currentVersion: true },
    });
  }

  /** Duyệt: ghi Review + áp transition, cùng 1 transaction. Role kiểm ở controller. */
  async review(id: string, dto: CreateReviewDto, user: AuthUser) {
    const piece = await this.getOrThrow(id);
    if (!piece.currentVersionId) {
      throw new BadRequestException('Bài chưa có nội dung để duyệt');
    }

    let nextStatus: ContentStatus | null = null;
    if (dto.decision === ReviewDecision.APPROVED) {
      assertTransition(piece.status, ContentStatus.APPROVED);
      nextStatus = ContentStatus.APPROVED;
    } else if (dto.decision === ReviewDecision.CHANGES_REQUESTED) {
      assertTransition(piece.status, ContentStatus.DRAFT);
      nextStatus = ContentStatus.DRAFT;
    }
    // COMMENT: không đổi trạng thái.

    return this.prisma.$transaction(async (tx) => {
      await tx.review.create({
        data: {
          pieceId: id,
          versionId: piece.currentVersionId!,
          reviewerId: user.userId,
          decision: dto.decision,
          comment: dto.comment,
        },
      });
      if (nextStatus) {
        return tx.contentPiece.update({
          where: { id },
          data: { status: nextStatus },
          include: { currentVersion: true },
        });
      }
      return tx.contentPiece.findUniqueOrThrow({
        where: { id },
        include: { currentVersion: true },
      });
    });
  }

  private async getOrThrow(id: string) {
    const piece = await this.prisma.contentPiece.findFirst({
      where: { id, deletedAt: null },
    });
    if (!piece) {
      throw new NotFoundException('Không tìm thấy nội dung');
    }
    return piece;
  }
}
