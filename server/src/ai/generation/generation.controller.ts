import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  CurrentUser,
  type AuthUser,
} from '../../auth/decorators/current-user.decorator';
import { GenerationService } from './generation.service';

@Controller()
export class GenerationController {
  constructor(private readonly generation: GenerationService) {}

  // Gọi AI: mọi role (WRITER chỉ bài của mình — kiểm trong service).
  @Post('content/:id/generate')
  @HttpCode(HttpStatus.ACCEPTED)
  generate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.generation.requestGeneration(id, user);
  }

  @Get('generations/:id')
  status(@Param('id') id: string) {
    return this.generation.getStatus(id);
  }
}
