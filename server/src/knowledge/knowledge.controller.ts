import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Roles(Role.ADMIN, Role.MANAGER, Role.EDITOR)
  @Post()
  create(@Body() dto: CreateKnowledgeDto) {
    return this.knowledge.create(dto);
  }

  @Get()
  findAll(@Query('productLineId') productLineId?: string) {
    return this.knowledge.findAll(productLineId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.knowledge.findOne(id);
  }

  @Get(':id/chunks')
  chunks(@Param('id') id: string) {
    return this.knowledge.listChunks(id);
  }
}
