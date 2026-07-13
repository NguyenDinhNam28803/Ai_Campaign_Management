import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateProductLineDto } from './dto/create-product-line.dto';
import { UpdateProductLineDto } from './dto/update-product-line.dto';
import { ProductLineService } from './product-line.service';

@Controller('product-lines')
export class ProductLineController {
  constructor(private readonly productLine: ProductLineService) {}

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  create(@Body() dto: CreateProductLineDto) {
    return this.productLine.create(dto);
  }

  // Đọc: mọi user đã đăng nhập.
  @Get()
  findAll() {
    return this.productLine.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productLine.findOne(id);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductLineDto) {
    return this.productLine.update(id, dto);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productLine.remove(id);
  }
}
