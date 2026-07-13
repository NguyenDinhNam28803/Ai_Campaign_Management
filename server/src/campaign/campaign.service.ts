import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Campaign } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCampaignDto, userId: string): Promise<Campaign> {
    // Đảm bảo ProductLine tồn tại & chưa xóa.
    const pl = await this.prisma.productLine.findFirst({
      where: { id: dto.productLineId, deletedAt: null },
    });
    if (!pl) {
      throw new NotFoundException('Không tìm thấy dòng sản phẩm');
    }
    return this.prisma.campaign.create({
      data: {
        productLineId: dto.productLineId,
        name: dto.name,
        goal: dto.goal,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        createdBy: userId,
      },
    });
  }

  findAll(productLineId?: string): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      where: { deletedAt: null, productLineId: productLineId ?? undefined },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Campaign> {
    const c = await this.prisma.campaign.findFirst({
      where: { id, deletedAt: null },
    });
    if (!c) {
      throw new NotFoundException('Không tìm thấy chiến dịch');
    }
    return c;
  }

  async update(id: string, dto: UpdateCampaignDto): Promise<Campaign> {
    await this.findOne(id);
    return this.prisma.campaign.update({
      where: { id },
      data: {
        name: dto.name,
        goal: dto.goal,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string): Promise<Campaign> {
    await this.findOne(id);
    return this.prisma.campaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
