import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ContentStatus, Role } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  // Tạo/sửa: mọi role đã đăng nhập; ownership (WRITER own-only) kiểm trong service.
  @Post()
  create(@Body() dto: CreateContentDto, @CurrentUser() user: AuthUser) {
    return this.content.create(dto, user);
  }

  @Get()
  findAll(
    @Query('campaignId') campaignId?: string,
    @Query('status') status?: ContentStatus,
  ) {
    return this.content.findAll(campaignId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.content.findOne(id);
  }

  @Get(':id/versions')
  versions(@Param('id') id: string) {
    return this.content.listVersions(id);
  }

  @Patch(':id')
  updateMeta(
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.content.updateMeta(id, dto, user);
  }

  @Post(':id/versions')
  addVersion(
    @Param('id') id: string,
    @Body() dto: CreateVersionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.content.addVersion(id, dto, user);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.content.submit(id, user);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.EDITOR)
  @Post(':id/reopen')
  reopen(@Param('id') id: string) {
    return this.content.reopen(id);
  }

  // Duyệt: chỉ ADMIN/MANAGER (ma trận §7).
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post(':id/reviews')
  review(
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.content.review(id, dto, user);
  }
}
