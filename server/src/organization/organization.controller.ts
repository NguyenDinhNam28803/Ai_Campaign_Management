import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationService } from './organization.service';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly organization: OrganizationService) {}

  // Mọi user đã đăng nhập được xem cấu hình (gồm ngân sách AI).
  @Get()
  get() {
    return this.organization.get();
  }

  @Roles(Role.ADMIN)
  @Patch()
  update(@Body() dto: UpdateOrganizationDto) {
    return this.organization.update(dto);
  }
}
