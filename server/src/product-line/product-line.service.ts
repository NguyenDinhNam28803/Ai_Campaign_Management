import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductLine } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductLineDto } from './dto/create-product-line.dto';
import { UpdateProductLineDto } from './dto/update-product-line.dto';

@Injectable()
export class ProductLineService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductLineDto): Promise<ProductLine> {
    try {
      return await this.prisma.productLine.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          voiceProfile: dto.voiceProfile as Prisma.InputJsonValue,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Slug đã tồn tại');
      }
      throw e;
    }
  }

  findAll(): Promise<ProductLine[]> {
    return this.prisma.productLine.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<ProductLine> {
    const pl = await this.prisma.productLine.findFirst({
      where: { id, deletedAt: null },
    });
    if (!pl) {
      throw new NotFoundException('Không tìm thấy dòng sản phẩm');
    }
    return pl;
  }

  async update(id: string, dto: UpdateProductLineDto): Promise<ProductLine> {
    await this.findOne(id);
    return this.prisma.productLine.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        voiceProfile: dto.voiceProfile as Prisma.InputJsonValue,
      },
    });
  }

  /** Soft delete để giữ tham chiếu từ Campaign/Knowledge/Channel. */
  async remove(id: string): Promise<ProductLine> {
    await this.findOne(id);
    return this.prisma.productLine.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
