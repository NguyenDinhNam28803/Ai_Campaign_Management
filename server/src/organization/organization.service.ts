import { Injectable, NotFoundException } from '@nestjs/common';
import { Organization } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  /** Organization là singleton — luôn đọc bản ghi đầu tiên. */
  async get(): Promise<Organization> {
    const org = await this.prisma.organization.findFirst();
    if (!org) {
      throw new NotFoundException(
        'Chưa có Organization. Hãy chạy prisma db seed.',
      );
    }
    return org;
  }

  async update(dto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.get();
    return this.prisma.organization.update({
      where: { id: org.id },
      data: {
        name: dto.name,
        monthlyAiBudgetUsd: dto.monthlyAiBudgetUsd,
        defaultModel: dto.defaultModel,
      },
    });
  }
}
