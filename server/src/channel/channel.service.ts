import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChannelStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { encrypt } from './encryption.util';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChannelDto) {
    const pl = await this.prisma.productLine.findFirst({
      where: { id: dto.productLineId, deletedAt: null },
    });
    if (!pl) {
      throw new NotFoundException('ProductLine không tồn tại');
    }

    return this.prisma.channel.create({
      data: {
        productLineId: dto.productLineId,
        type: dto.type,
        name: dto.name,
        config: dto.config as Prisma.InputJsonValue,
        credentialsEncrypted: encrypt(dto.credentials),
      },
    });
  }

  async findAll(productLineId?: string) {
    return this.prisma.channel.findMany({
      where: productLineId ? { productLineId } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        productLineId: true,
        type: true,
        name: true,
        config: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const ch = await this.prisma.channel.findUnique({ where: { id } });
    if (!ch) throw new NotFoundException('Channel không tồn tại');
    const { credentialsEncrypted: _, ...rest } = ch;
    return rest;
  }

  async update(id: string, dto: UpdateChannelDto) {
    const ch = await this.prisma.channel.findUnique({ where: { id } });
    if (!ch) throw new NotFoundException('Channel không tồn tại');

    return this.prisma.channel.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.config !== undefined && {
          config: dto.config as Prisma.InputJsonValue,
        }),
        ...(dto.credentials !== undefined && {
          credentialsEncrypted: encrypt(dto.credentials),
        }),
      },
      select: {
        id: true,
        productLineId: true,
        type: true,
        name: true,
        config: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async disconnect(id: string) {
    const ch = await this.prisma.channel.findUnique({ where: { id } });
    if (!ch) throw new NotFoundException('Channel không tồn tại');

    return this.prisma.channel.update({
      where: { id },
      data: { status: ChannelStatus.DISCONNECTED },
    });
  }
}
