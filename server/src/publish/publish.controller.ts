import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { PublishService } from './publish.service';
import { CreatePublicationDto } from './dto/create-publication.dto';

@Controller('publications')
export class PublicationController {
  constructor(private readonly publish: PublishService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  create(
    @Body() dto: CreatePublicationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.publish.create(dto, user);
  }

  @Get()
  findAll(
    @Query('pieceId') pieceId?: string,
    @Query('channelId') channelId?: string,
    @Query('status') status?: string,
  ) {
    return this.publish.findAll({ pieceId, channelId, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.publish.findOne(id);
  }

  @Post(':id/publish')
  @Roles(Role.ADMIN, Role.MANAGER)
  publishNow(@Param('id') id: string) {
    return this.publish.publishNow(id);
  }

  @Patch(':id/schedule')
  @Roles(Role.ADMIN, Role.MANAGER)
  schedule(
    @Param('id') id: string,
    @Body('scheduledAt') scheduledAt: string,
  ) {
    return this.publish.schedule(id, scheduledAt);
  }
}
