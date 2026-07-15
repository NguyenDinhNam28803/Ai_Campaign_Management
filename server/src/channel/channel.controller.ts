import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Controller('channels')
export class ChannelController {
  constructor(private readonly channel: ChannelService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@Body() dto: CreateChannelDto) {
    return this.channel.create(dto);
  }

  @Get()
  findAll(@Query('productLineId') productLineId?: string) {
    return this.channel.findAll(productLineId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.channel.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateChannelDto) {
    return this.channel.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  disconnect(@Param('id') id: string) {
    return this.channel.disconnect(id);
  }
}
